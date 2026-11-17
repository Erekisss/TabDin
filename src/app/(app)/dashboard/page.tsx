import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Landmark, Repeat, Sparkles, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { money, monthLabel, shortDate, startOfMonthISO } from "@/lib/format";
import type { Account, Category, Transaction } from "@/lib/types";
import { CategoryIcon, EmptyState, PageHeader } from "@/components/ui";
import { CashflowChart, type CashflowPoint } from "./CashflowChart";
import { BudgetCard } from "./BudgetCard";
import { findSubscriptions } from "@/lib/insights";

export const metadata: Metadata = { title: "Início" };

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const since = startOfMonthISO(-5);
  const thisMonth = startOfMonthISO(0);

  const [{ data: accounts }, { data: txs }, { data: categories }, { data: budgets }, { data: profile }] =
    await Promise.all([
      supabase.from("accounts").select("*").order("created_at"),
      supabase
        .from("transactions")
        .select("id, description, amount, type, date, category_id, account_id, source, notes, category:categories(name, color, icon)")
        .gte("date", since)
        .order("date", { ascending: false })
        .limit(2000),
      supabase.from("categories").select("id, name, type, color, icon").order("name"),
      supabase.from("budgets").select("category_id, amount"),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    ]);

  const accs = (accounts ?? []) as Account[];
  const list = (txs ?? []) as unknown as Transaction[];
  const cats = (categories ?? []) as Category[];

  if (accs.length === 0) {
    return (
      <>
        <PageHeader title={`Olá, ${profile?.full_name?.split(" ")[0] ?? ""}`} subtitle="Início" />
        <EmptyState
          icon={<Wallet size={26} />}
          title="Comece adicionando suas contas"
          text="Conecte um banco via Open Finance ou crie uma conta manual para ver seu painel."
          action={
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/open-finance" className="btn-primary">
                <Landmark size={18} /> Conectar banco
              </Link>
              <Link href="/contas" className="btn-secondary">
                Conta manual
              </Link>
            </div>
          }
        />
      </>
    );
  }

  const totalBalance = accs.filter((a) => a.type !== "credit").reduce((s, a) => s + Number(a.balance), 0);
  const creditDebt = accs.filter((a) => a.type === "credit").reduce((s, a) => s + Number(a.balance), 0);

  const monthTx = list.filter((t) => t.date >= thisMonth);
  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  // Fluxo de caixa dos últimos 6 meses
  const now = new Date();
  const cashflow: CashflowPoint[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const items = list.filter((t) => t.date.startsWith(key));
    return {
      month: monthLabel(d),
      receitas: items.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
      despesas: items.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  // Gastos do mês por categoria
  const spendByCat = new Map<string, number>();
  for (const t of monthTx) {
    if (t.type !== "expense") continue;
    const k = t.category_id ?? "none";
    spendByCat.set(k, (spendByCat.get(k) ?? 0) + Number(t.amount));
  }
  const catById = new Map(cats.map((c) => [c.id, c]));
  const topCats = [...spendByCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, value]) => ({ cat: catById.get(id), value }));
  const maxCat = topCats[0]?.value ?? 1;

  const budgetRows = (budgets ?? []).map((b) => ({
    category: catById.get(b.category_id)!,
    amount: Number(b.amount),
    spent: spendByCat.get(b.category_id) ?? 0,
  })).filter((b) => b.category);

  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });
  const prevExpense = cashflow[4]?.despesas ?? 0;
  const expenseChange = prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : null;
  const subs = await findSubscriptions(supabase);

  return (
    <>
      <PageHeader title={`Olá, ${profile?.full_name?.split(" ")[0] ?? ""}`} subtitle={now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} />

      {/* Pergunte ao Din */}
      <Link
        href="/assistente"
        className="glass border-brand rounded-full flex items-center gap-3 pl-2 pr-5 h-14 mb-5 group transition hover:bg-white/[0.06]"
      >
        <span className="icon-tile w-10 h-10 rounded-full bg-brand">
          <Sparkles size={18} color="#03140f" />
        </span>
        <span className="flex-1 text-label-2 text-[15px] truncate">Pergunte ao Din: &ldquo;onde gastei mais este mês?&rdquo;</span>
        <ChevronRight size={18} className="text-label-3 transition group-hover:translate-x-0.5" />
      </Link>

      {/* Hero: saldo total */}
      <section className="card-hero shine p-6 sm:p-8 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white/65 text-[15px] font-medium">Saldo consolidado</p>
            <p className="font-display text-[40px] sm:text-[54px] font-bold tracking-[-0.04em] text-white tabular mt-1 leading-none">{money(totalBalance)}</p>
          </div>
          <Link href="/contas" className="btn-secondary h-9 px-4 text-[13px] shrink-0">
            Contas <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 mt-6">
          <div>
            <p className="text-white/55 text-[13px]">Fatura dos cartões</p>
            <p className="text-white font-semibold tabular">{money(Math.abs(creditDebt))}</p>
          </div>
          <div>
            <p className="text-white/55 text-[13px]">Contas conectadas</p>
            <p className="text-white font-semibold">{accs.length}</p>
          </div>
          {expenseChange !== null && (
            <div>
              <p className="text-white/55 text-[13px]">Gastos vs. mês passado</p>
              <p className={`font-semibold flex items-center gap-1 ${expenseChange > 0 ? "text-ios-orange" : "text-ios-green"}`}>
                {expenseChange > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                {expenseChange > 0 ? "+" : ""}
                {expenseChange}%
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Receitas x despesas do mês */}
      <section className="grid grid-cols-2 gap-4 mb-5">
        <div className="card">
          <div className="flex items-center gap-2 text-label-2 text-[14px]">
            <span className="icon-tile w-7 h-7 rounded-full" style={{ background: "#12A877" }}>
              <ArrowDownLeft size={15} color="white" />
            </span>
            Receitas · {monthName}
          </div>
          <p className="text-[24px] sm:text-[28px] font-bold tabular mt-3">{money(income)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-label-2 text-[14px]">
            <span className="icon-tile w-7 h-7 rounded-full" style={{ background: "#7B6CF6" }}>
              <ArrowUpRight size={15} color="white" />
            </span>
            Despesas · {monthName}
          </div>
          <p className="text-[24px] sm:text-[28px] font-bold tabular mt-3">{money(expense)}</p>
        </div>
      </section>

      <div className="grid lg:grid-cols-5 gap-5 mb-5">
        <section className="card lg:col-span-3">
          <h2 className="text-[17px] font-semibold">Fluxo de caixa</h2>
          <p className="text-label-3 text-[13px] mb-4">Receitas e despesas nos últimos 6 meses</p>
          <CashflowChart data={cashflow} />
        </section>

        <section className="card lg:col-span-2">
          <h2 className="text-[17px] font-semibold">Gastos por categoria</h2>
          <p className="text-label-3 text-[13px] mb-4">Este mês</p>
          {topCats.length === 0 ? (
            <p className="text-label-2 text-[15px] py-6 text-center">Nenhuma despesa neste mês.</p>
          ) : (
            <ul className="space-y-3.5">
              {topCats.map(({ cat, value }) => (
                <li key={cat?.id ?? "none"} className="flex items-center gap-3">
                  <CategoryIcon icon={cat?.icon} color={cat?.color} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[14px] mb-1.5">
                      <span className="truncate">{cat?.name ?? "Sem categoria"}</span>
                      <span className="tabular font-medium">{money(value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(value / maxCat) * 100}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <BudgetCard rows={budgetRows} categories={cats.filter((c) => c.type === "expense")} />

          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="section-label mb-0">Assinaturas detectadas</p>
              {subs.count > 0 && <span className="text-[13px] text-label-2 tabular">{money(subs.monthly_total)}/mês</span>}
            </div>
            <div className="ios-list">
              {subs.count === 0 && (
                <div className="p-5 flex items-center gap-3 text-label-2 text-[15px]">
                  <Repeat size={20} className="text-brand-2" /> Nenhuma cobrança recorrente encontrada.
                </div>
              )}
              {subs.subscriptions.slice(0, 5).map((sub) => (
                <div key={sub.name} className="ios-row">
                  <span className="icon-tile w-9 h-9 bg-gradient-to-br from-ios-indigo to-brand-3">
                    <Repeat size={16} color="white" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] truncate">{sub.name}</p>
                    <p className="text-[13px] text-label-3">Visto em {sub.months_seen} meses · último {shortDate(sub.last_charge)}</p>
                  </div>
                  <p className="tabular font-semibold text-[15px]">{money(sub.monthly_amount)}</p>
                </div>
              ))}
            </div>
            {subs.count > 0 && (
              <p className="text-[12px] text-label-3 mt-2 px-1">Isso dá {money(subs.yearly_total)} por ano. Pergunte ao Din se vale cortar alguma.</p>
            )}
          </section>
        </div>

        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="section-label mb-0">Últimas transações</p>
            <Link href="/transacoes" className="text-ios-blue text-[14px] font-medium flex items-center">
              Ver todas <ChevronRight size={16} />
            </Link>
          </div>
          <div className="ios-list">
            {list.slice(0, 6).map((t) => (
              <div key={t.id} className="ios-row">
                <CategoryIcon icon={t.category?.icon} color={t.category?.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] truncate">{t.description}</p>
                  <p className="text-[13px] text-label-3">{t.category?.name ?? "Sem categoria"} · {shortDate(t.date)}</p>
                </div>
                <p className={`tabular font-semibold text-[15px] ${t.type === "income" ? "text-ios-green" : "text-label"}`}>
                  {t.type === "income" ? "+" : "−"}
                  {money(t.amount)}
                </p>
              </div>
            ))}
            {list.length === 0 && <p className="p-5 text-label-2 text-[15px]">Nenhuma transação ainda.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
