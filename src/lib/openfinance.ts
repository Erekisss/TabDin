import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountType, TxType } from "./types";

/* =========================================================
   Pluggy — agregador de Open Finance Brasil
   Docs: https://docs.pluggy.ai
   ========================================================= */

const PLUGGY_API = "https://api.pluggy.ai";

export function pluggyEnabled() {
  return Boolean(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET);
}

async function pluggyApiKey(): Promise<string> {
  const res = await fetch(`${PLUGGY_API}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: process.env.PLUGGY_CLIENT_ID,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Pluggy auth falhou (${res.status})`);
  const { apiKey } = (await res.json()) as { apiKey: string };
  return apiKey;
}

async function pluggyGet<T>(apiKey: string, path: string): Promise<T> {
  const res = await fetch(`${PLUGGY_API}${path}`, {
    headers: { "X-API-KEY": apiKey },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Pluggy ${path} falhou (${res.status})`);
  return res.json() as Promise<T>;
}

export async function createConnectToken(userId: string, itemId?: string) {
  const apiKey = await pluggyApiKey();
  const res = await fetch(`${PLUGGY_API}/connect_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({ ...(itemId ? { itemId } : {}), options: { clientUserId: userId } }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Pluggy connect_token falhou (${res.status})`);
  const { accessToken } = (await res.json()) as { accessToken: string };
  return accessToken;
}

interface PluggyItem {
  id: string;
  status: string;
  clientUserId?: string | null;
  connector: { name: string; imageUrl?: string; primaryColor?: string };
}
interface PluggyAccount {
  id: string;
  type: "BANK" | "CREDIT" | "INVESTMENT" | string;
  subtype?: string;
  name: string;
  marketingName?: string;
  balance: number;
  currencyCode?: string;
}
interface PluggyTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "DEBIT" | "CREDIT";
  category?: string | null;
}
interface Page<T> {
  results: T[];
  page?: number;
  totalPages?: number;
}

/* =========================================================
   Normalização comum (Pluggy e Banco Demo)
   ========================================================= */

export interface NormalizedAccount {
  external_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}
export interface NormalizedTx {
  external_id: string;
  account_external_id: string;
  description: string;
  amount: number;
  type: TxType;
  date: string;
  hint?: string | null;
}
export interface NormalizedItem {
  external_item_id: string;
  institution_name: string;
  institution_logo: string | null;
  institution_color: string | null;
  status: string;
  accounts: NormalizedAccount[];
  transactions: NormalizedTx[];
}

function mapAccountType(a: PluggyAccount): AccountType {
  if (a.type === "CREDIT") return "credit";
  if (a.type === "INVESTMENT") return "investment";
  if (a.subtype === "SAVINGS_ACCOUNT") return "savings";
  return "checking";
}

export async function fetchPluggyItem(
  itemId: string,
  userId: string,
  days = 90,
): Promise<NormalizedItem> {
  const apiKey = await pluggyApiKey();
  const item = await pluggyGet<PluggyItem>(apiKey, `/items/${encodeURIComponent(itemId)}`);
  // O connect token é emitido com clientUserId = id do usuário; impede sincronizar item de outra pessoa.
  if (item.clientUserId !== userId) throw new Error("Item não pertence a este usuário");
  const { results: accounts } = await pluggyGet<Page<PluggyAccount>>(
    apiKey,
    `/accounts?itemId=${encodeURIComponent(itemId)}`,
  );

  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const transactions: NormalizedTx[] = [];

  for (const acc of accounts) {
    let page = 1;
    let totalPages = 1;
    do {
      const data = await pluggyGet<Page<PluggyTransaction>>(
        apiKey,
        `/transactions?accountId=${acc.id}&from=${from}&pageSize=500&page=${page}`,
      );
      totalPages = data.totalPages ?? 1;
      for (const t of data.results) {
        transactions.push({
          external_id: `pluggy:${t.id}`,
          account_external_id: `pluggy:${acc.id}`,
          description: t.description,
          amount: Math.abs(t.amount),
          type: t.type === "CREDIT" ? "income" : "expense",
          date: t.date.slice(0, 10),
          hint: t.category,
        });
      }
      page++;
    } while (page <= totalPages && page <= 10);
  }

  return {
    external_item_id: item.id,
    institution_name: item.connector.name,
    institution_logo: item.connector.imageUrl ?? null,
    institution_color: item.connector.primaryColor ? `#${item.connector.primaryColor.replace("#", "")}` : null,
    status: item.status,
    accounts: accounts.map((a) => ({
      external_id: `pluggy:${a.id}`,
      name: a.marketingName || a.name,
      type: mapAccountType(a),
      balance: a.type === "CREDIT" ? -Math.abs(a.balance) : a.balance,
      currency: a.currencyCode ?? "BRL",
    })),
    transactions,
  };
}

/* =========================================================
   Banco Demo — dados simulados para quem visita o portfólio
   ========================================================= */

const DEMO_MERCHANTS: Array<[string, string, number, number]> = [
  ["iFood", "alimentação", 25, 90],
  ["Supermercado Pão de Açúcar", "alimentação", 80, 420],
  ["Uber", "transporte", 12, 48],
  ["Posto Shell", "transporte", 120, 260],
  ["Netflix", "assinaturas", 55.9, 55.9],
  ["Spotify", "assinaturas", 21.9, 21.9],
  ["Drogasil", "saúde", 18, 140],
  ["Amazon", "compras", 40, 380],
  ["Cinemark", "lazer", 35, 90],
  ["Aluguel", "moradia", 2100, 2100],
  ["Enel Energia", "moradia", 140, 260],
  ["Udemy", "educação", 27.9, 79.9],
];

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function buildDemoItem(userId: string): NormalizedItem {
  const rnd = seeded(Array.from(userId).reduce((a, c) => a + c.charCodeAt(0), 0));
  const checking = "demo:checking";
  const credit = "demo:credit";
  const transactions: NormalizedTx[] = [];
  const now = new Date();
  let n = 0;

  for (let m = 5; m >= 0; m--) {
    const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const lastDay = m === 0 ? now.getDate() : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const iso = (d: number) =>
      `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;

    transactions.push({
      external_id: `demo:${month.getFullYear()}${month.getMonth()}:salary`,
      account_external_id: checking,
      description: "Salário — Empresa XYZ",
      amount: 8500,
      type: "income",
      date: iso(5),
      hint: "salário",
    });
    if (rnd() > 0.5) {
      transactions.push({
        external_id: `demo:${month.getFullYear()}${month.getMonth()}:div`,
        account_external_id: checking,
        description: "Rendimento CDB",
        amount: Math.round(80 + rnd() * 200),
        type: "income",
        date: iso(15),
        hint: "investimentos",
      });
    }
    const count = 14 + Math.floor(rnd() * 8);
    for (let i = 0; i < count; i++) {
      const [name, hint, min, max] = DEMO_MERCHANTS[Math.floor(rnd() * DEMO_MERCHANTS.length)];
      const day = 1 + Math.floor(rnd() * lastDay);
      transactions.push({
        external_id: `demo:${month.getFullYear()}${month.getMonth()}:${n++}`,
        account_external_id: hint === "moradia" ? checking : rnd() > 0.4 ? credit : checking,
        description: name,
        amount: Math.round((min + rnd() * (max - min)) * 100) / 100,
        type: "expense",
        date: iso(day),
        hint,
      });
    }
  }

  return {
    external_item_id: "demo-bank",
    institution_name: "Banco Demo (Open Finance Sandbox)",
    institution_logo: null,
    institution_color: "#0A84FF",
    status: "UPDATED",
    accounts: [
      { external_id: checking, name: "Conta Corrente Demo", type: "checking", balance: 12480.35, currency: "BRL" },
      { external_id: credit, name: "Cartão Platinum Demo", type: "credit", balance: -2315.7, currency: "BRL" },
      { external_id: "demo:invest", name: "CDB Liquidez Diária", type: "investment", balance: 28650, currency: "BRL" },
    ],
    transactions,
  };
}

/* =========================================================
   Persistência no Supabase (usa a sessão do usuário → RLS)
   ========================================================= */

const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/sal[aá]r|payroll|salary/i, "Salário"],
  [/invest|rendiment|cdb|dividend/i, "Investimentos"],
  [/aliment|food|restaurant|ifood|mercado|supermarket|grocer/i, "Alimentação"],
  [/moradia|aluguel|rent|housing|energia|electric|water|utilities/i, "Moradia"],
  [/transport|uber|99|posto|gas station|fuel|combust/i, "Transporte"],
  [/sa[uú]de|health|pharm|drog|farm[aá]c/i, "Saúde"],
  [/lazer|leisure|entertain|cinema|travel|viage/i, "Lazer"],
  [/educa|education|udemy|curso|school/i, "Educação"],
  [/assinatura|subscription|netflix|spotify|streaming|digital services/i, "Assinaturas"],
  [/compra|shopping|amazon|store|loja/i, "Compras"],
];

function guessCategory(tx: NormalizedTx) {
  const text = `${tx.hint ?? ""} ${tx.description}`;
  for (const [re, name] of CATEGORY_RULES) if (re.test(text)) return name;
  return tx.type === "income" ? "Outras receitas" : "Outros";
}

export async function persistItem(
  supabase: SupabaseClient,
  provider: "pluggy" | "demo",
  item: NormalizedItem,
) {
  const { data: conn, error: connErr } = await supabase
    .from("bank_connections")
    .upsert(
      {
        provider,
        external_item_id: item.external_item_id,
        institution_name: item.institution_name,
        institution_logo: item.institution_logo,
        institution_color: item.institution_color,
        status: item.status,
        last_sync_at: new Date().toISOString(),
      },
      { onConflict: "user_id,external_item_id" },
    )
    .select("id")
    .single();
  if (connErr) throw connErr;

  const color = item.institution_color ?? "#0A84FF";
  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .upsert(
      item.accounts.map((a) => ({
        connection_id: conn.id,
        name: a.name,
        institution: item.institution_name,
        type: a.type,
        balance: a.balance,
        currency: a.currency,
        color,
        source: "open_finance",
        external_id: a.external_id,
      })),
      { onConflict: "user_id,external_id" },
    )
    .select("id, external_id");
  if (accErr) throw accErr;

  const accountByExt = new Map(accounts.map((a) => [a.external_id, a.id]));

  const { data: categories } = await supabase.from("categories").select("id, name, type");
  const catKey = (name: string, type: string) => `${type}:${name}`;
  const catByKey = new Map((categories ?? []).map((c) => [catKey(c.name, c.type), c.id]));

  const rows = item.transactions
    .filter((t) => accountByExt.has(t.account_external_id))
    .map((t) => ({
      account_id: accountByExt.get(t.account_external_id)!,
      category_id: catByKey.get(catKey(guessCategory(t), t.type)) ?? null,
      description: t.description,
      amount: t.amount,
      type: t.type,
      date: t.date,
      source: "open_finance",
      external_id: t.external_id,
    }));

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from("transactions")
      // ignoreDuplicates: preserva edições do usuário (ex.: categoria trocada manualmente)
      .upsert(rows.slice(i, i + 500), { onConflict: "user_id,external_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  return { accounts: accounts.length, transactions: rows.length };
}
