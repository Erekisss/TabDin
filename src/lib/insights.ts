import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/* =========================================================
   Consultas financeiras usadas pelo assistente "Din" e pelo dashboard.
   Rodam com o cliente do usuário logado: o RLS garante que só os dados dele aparecem.
   ========================================================= */

type Tx = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: { name: string } | null;
  account: { name: string } | null;
};

const pad = (n: number) => String(n).padStart(2, "0");
export const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function monthRange(key: string) {
  const [y, m] = key.split("-").map(Number);
  const next = new Date(y, m, 1);
  return { start: `${key}-01`, end: `${monthKey(next)}-01` };
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

async function fetchTx(sb: SupabaseClient, from: string, to: string) {
  const { data, error } = await sb
    .from("transactions")
    .select("id, description, amount, type, date, category:categories(name), account:accounts(name)")
    .gte("date", from)
    .lt("date", to)
    .order("date", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as unknown as Tx[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export async function getBalances(sb: SupabaseClient) {
  const { data, error } = await sb.from("accounts").select("name, institution, type, balance").order("name");
  if (error) throw error;
  const accounts = (data ?? []).map((a) => ({ ...a, balance: Number(a.balance) }));
  const total = accounts.filter((a) => a.type !== "credit").reduce((s, a) => s + a.balance, 0);
  const creditDebt = accounts.filter((a) => a.type === "credit").reduce((s, a) => s + a.balance, 0);
  return { total: r2(total), credit_card_debt: r2(Math.abs(creditDebt)), accounts };
}

export async function getMonthSummary(sb: SupabaseClient, key: string) {
  const { start, end } = monthRange(key);
  const tx = await fetchTx(sb, start, end);
  const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const byCat = new Map<string, number>();
  for (const t of tx) {
    if (t.type !== "expense") continue;
    const k = t.category?.name ?? "Sem categoria";
    byCat.set(k, (byCat.get(k) ?? 0) + t.amount);
  }
  const categories = [...byCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, total]) => ({ name, total: r2(total), share: expense ? Math.round((total / expense) * 100) : 0 }));
  const biggest = tx
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((t) => ({ description: t.description, amount: t.amount, date: t.date, category: t.category?.name ?? null }));
  return { month: key, income: r2(income), expense: r2(expense), net: r2(income - expense), categories, biggest_expenses: biggest, transaction_count: tx.length };
}

export async function compareMonths(sb: SupabaseClient, a: string, b: string) {
  const [ma, mb] = await Promise.all([getMonthSummary(sb, a), getMonthSummary(sb, b)]);
  const names = new Set([...ma.categories, ...mb.categories].map((c) => c.name));
  const diff = [...names]
    .map((name) => {
      const va = ma.categories.find((c) => c.name === name)?.total ?? 0;
      const vb = mb.categories.find((c) => c.name === name)?.total ?? 0;
      return { name, [a]: va, [b]: vb, change: r2(vb - va) };
    })
    .sort((x, y) => Math.abs(y.change) - Math.abs(x.change));
  return {
    months: [a, b],
    expense: { [a]: ma.expense, [b]: mb.expense, change: r2(mb.expense - ma.expense), change_pct: ma.expense ? Math.round(((mb.expense - ma.expense) / ma.expense) * 100) : null },
    income: { [a]: ma.income, [b]: mb.income, change: r2(mb.income - ma.income) },
    by_category: diff,
  };
}

export async function searchTransactions(
  sb: SupabaseClient,
  f: { query?: string; category?: string; type?: "income" | "expense"; from?: string; to?: string; limit?: number },
) {
  // "!inner" faz o filtro por nome de categoria restringir as transações (e não só o join)
  const categoryJoin = f.category ? "categories!inner(name)" : "categories(name)";
  let q = sb
    .from("transactions")
    .select(`description, amount, type, date, category:${categoryJoin}, account:accounts(name)`)
    .order("date", { ascending: false })
    .limit(Math.min(f.limit ?? 20, 100));
  if (f.category) q = q.ilike("categories.name", f.category.replace(/[%_]/g, ""));
  if (f.query) q = q.ilike("description", `%${f.query.replace(/[%_]/g, "")}%`);
  if (f.type) q = q.eq("type", f.type);
  if (f.from) q = q.gte("date", f.from);
  if (f.to) q = q.lte("date", f.to);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) }));
  const total = rows.reduce((s, t) => s + (t.type === "expense" ? t.amount : 0), 0);
  return { count: rows.length, total_expense: r2(total), transactions: rows };
}

/** Detecta assinaturas/cobranças recorrentes: mesmo estabelecimento, valor parecido, em 2+ meses distintos. */
export async function findSubscriptions(sb: SupabaseClient) {
  const now = new Date();
  const from = `${shiftMonth(monthKey(now), -5)}-01`;
  const to = `${shiftMonth(monthKey(now), 1)}-01`;
  const tx = (await fetchTx(sb, from, to)).filter((t) => t.type === "expense");

  const groups = new Map<string, Tx[]>();
  for (const t of tx) {
    const k = t.description.toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim();
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }
  const subs = [];
  for (const items of groups.values()) {
    const months = new Set(items.map((t) => t.date.slice(0, 7)));
    if (months.size < 2) continue;
    const amounts = items.map((t) => t.amount);
    const avg = amounts.reduce((s, n) => s + n, 0) / amounts.length;
    const stable = amounts.every((a) => Math.abs(a - avg) / avg < 0.15);
    const looksSub = /netflix|spotify|prime|disney|hbo|max|youtube|apple|icloud|google|globo|deezer|udemy|academia|gym|assinatura/i.test(items[0].description);
    if (!stable && !looksSub) continue;
    if (months.size < 3 && !looksSub) continue;
    const last = items[0];
    subs.push({
      name: last.description,
      monthly_amount: r2(avg),
      months_seen: months.size,
      last_charge: last.date,
      category: last.category?.name ?? null,
    });
  }
  subs.sort((a, b) => b.monthly_amount - a.monthly_amount);
  return {
    count: subs.length,
    monthly_total: r2(subs.reduce((s, x) => s + x.monthly_amount, 0)),
    yearly_total: r2(subs.reduce((s, x) => s + x.monthly_amount, 0) * 12),
    subscriptions: subs,
  };
}

export async function getBudgets(sb: SupabaseClient) {
  const key = monthKey(new Date());
  const [{ data }, summary] = await Promise.all([
    sb.from("budgets").select("amount, category:categories(name)"),
    getMonthSummary(sb, key),
  ]);
  return (data ?? []).map((b) => {
    const name = (b.category as unknown as { name: string } | null)?.name ?? "?";
    const spent = summary.categories.find((c) => c.name === name)?.total ?? 0;
    const limit = Number(b.amount);
    return { category: name, limit, spent, remaining: r2(limit - spent), used_pct: Math.round((spent / limit) * 100) };
  });
}
