import type { Metadata } from "next";
import { CreditCard, Landmark, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import { ACCOUNT_TYPE_LABEL, type Account, type AccountType } from "@/lib/types";
import { EmptyState, PageHeader } from "@/components/ui";
import { DeleteAccountButton, NewAccountButton } from "./AccountActions";

export const metadata: Metadata = { title: "Contas" };

const ICON: Record<AccountType, typeof Wallet> = {
  checking: Landmark,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  wallet: Wallet,
};

export default async function AccountsPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("accounts").select("*").order("created_at");
  const accounts = (data ?? []) as Account[];

  const groups: Array<[string, Account[]]> = [
    ["Open Finance", accounts.filter((a) => a.source === "open_finance")],
    ["Contas manuais", accounts.filter((a) => a.source === "manual")],
  ];

  return (
    <>
      <PageHeader title="Contas" subtitle="Patrimônio" action={<NewAccountButton />} />

      {accounts.length === 0 ? (
        <EmptyState icon={<Wallet size={26} />} title="Nenhuma conta" text="Crie uma conta manual ou conecte um banco pelo Open Finance." />
      ) : (
        <div className="space-y-8">
          {groups.filter(([, list]) => list.length).map(([label, list]) => (
            <section key={label}>
              <p className="section-label">{label}</p>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {list.map((a) => {
                  const Icon = ICON[a.type];
                  return (
                    <div
                      key={a.id}
                      className="relative overflow-hidden rounded-[24px] p-5 border border-white/10 min-h-[170px] flex flex-col"
                      style={{
                        background: `linear-gradient(145deg, ${a.color}55 0%, rgba(12,24,52,.9) 55%, rgba(5,12,30,.95) 100%)`,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,.1), 0 20px 40px -25px rgba(0,0,0,.7)",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="icon-tile w-10 h-10" style={{ background: a.color }}>
                          <Icon size={20} color="white" />
                        </div>
                        {a.source === "manual" && <DeleteAccountButton id={a.id} name={a.name} />}
                      </div>
                      <div className="mt-auto pt-6">
                        <p className="text-[13px] text-label-2">{ACCOUNT_TYPE_LABEL[a.type]}{a.institution ? ` · ${a.institution}` : ""}</p>
                        <p className="text-[16px] font-semibold truncate">{a.name}</p>
                        <p className={`text-[26px] font-bold tabular tracking-tight mt-1 ${Number(a.balance) < 0 ? "text-ios-red" : ""}`}>
                          {money(a.balance)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
