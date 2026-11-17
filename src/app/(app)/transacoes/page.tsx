import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import type { Account, Category, Transaction } from "@/lib/types";
import { EmptyState, PageHeader } from "@/components/ui";
import { NewTransactionButton } from "./NewTransaction";
import { TransactionList } from "./TransactionList";

export const metadata: Metadata = { title: "Transações" };

function parseMonth(m: unknown) {
  const now = new Date();
  if (typeof m === "string" && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    return new Date(y, mo - 1, 1);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default async function TransactionsPage({ searchParams }: PageProps<"/transacoes">) {
  const sp = await searchParams;
  const month = parseMonth(sp.mes);
  const type = sp.tipo === "income" || sp.tipo === "expense" ? sp.tipo : "all";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";

  const start = `${key(month)}-01`;
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const end = `${key(nextMonth)}-01`;

  const { supabase } = await requireUser();
  let query = supabase
    .from("transactions")
    .select("id, description, amount, type, date, category_id, account_id, source, notes, category:categories(name, color, icon), account:accounts(name, color)")
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (type !== "all") query = query.eq("type", type);
  if (q) query = query.ilike("description", `%${q.replace(/[%_]/g, "")}%`);

  const [{ data: txs }, { data: accounts }, { data: categories }] = await Promise.all([
    query,
    supabase.from("accounts").select("id, name, type, color, source").order("name"),
    supabase.from("categories").select("id, name, type, color, icon").order("name"),
  ]);

  const list = (txs ?? []) as unknown as Transaction[];
  const income = list.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams({ mes: key(month), ...(type !== "all" && { tipo: type }), ...(q && { q }), ...over });
    for (const [k, v] of [...p.entries()]) if (!v || v === "all") p.delete(k);
    return `/transacoes?${p}`;
  };
  const prev = new Date(month.getFullYear(), month.getMonth() - 1, 1);

  return (
    <>
      <PageHeader
        title="Transações"
        subtitle="Movimentações"
        action={<NewTransactionButton accounts={(accounts ?? []) as Account[]} categories={(categories ?? []) as Category[]} />}
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="glass rounded-full flex items-center h-10 px-1">
          <Link href={href({ mes: key(prev) })} className="p-2 text-label-2 hover:text-label" aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </Link>
          <span className="px-2 text-[15px] font-semibold capitalize min-w-[130px] text-center">
            {month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </span>
          <Link href={href({ mes: key(nextMonth) })} className="p-2 text-label-2 hover:text-label" aria-label="Próximo mês">
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="segmented">
          {[["all", "Todas"], ["income", "Receitas"], ["expense", "Despesas"]].map(([v, l]) => (
            <Link key={v} href={href({ tipo: v })} data-active={type === v}>{l}</Link>
          ))}
        </div>

        <form className="flex-1 min-w-[200px]" action="/transacoes">
          <input type="hidden" name="mes" value={key(month)} />
          {type !== "all" && <input type="hidden" name="tipo" value={type} />}
          <input name="q" defaultValue={q} placeholder="Buscar descrição…" className="field h-10 rounded-full" />
        </form>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          ["Receitas", income, "text-ios-green"],
          ["Despesas", expense, "text-label"],
          ["Saldo", income - expense, income - expense >= 0 ? "text-ios-green" : "text-ios-red"],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="card p-4">
            <p className="text-label-3 text-[13px]">{label}</p>
            <p className={`tabular font-bold text-[17px] sm:text-[22px] mt-1 ${cls}`}>{money(value as number)}</p>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight size={26} />}
          title="Nenhuma transação"
          text="Não há movimentações para este filtro. Adicione uma ou conecte um banco."
        />
      ) : (
        <TransactionList transactions={list} categories={(categories ?? []) as Category[]} />
      )}
    </>
  );
}
