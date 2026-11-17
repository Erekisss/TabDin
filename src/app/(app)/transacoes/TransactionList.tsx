"use client";

import { useTransition } from "react";
import { Landmark, Trash2 } from "lucide-react";
import { deleteTransaction, updateTransactionCategory } from "../actions";
import { money } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import { CategoryIcon } from "@/components/ui";

function dayLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

export function TransactionList({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const [pending, start] = useTransition();
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);

  return (
    <div className={`space-y-6 ${pending ? "opacity-70 transition" : ""}`}>
      {[...groups.entries()].map(([date, items]) => (
        <section key={date}>
          <p className="section-label capitalize">{dayLabel(date)}</p>
          <div className="ios-list">
            {items.map((t) => (
              <div key={t.id} className="ios-row group">
                <CategoryIcon icon={t.category?.icon} color={t.category?.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] truncate flex items-center gap-1.5">
                    {t.description}
                    {t.source === "open_finance" && <Landmark size={13} className="text-ios-blue shrink-0" aria-label="Open Finance" />}
                  </p>
                  <div className="flex items-center gap-2 text-[13px] text-label-3">
                    <select
                      aria-label="Categoria"
                      value={t.category_id ?? ""}
                      onChange={(e) => start(() => updateTransactionCategory(t.id, e.target.value || null))}
                      className="bg-transparent outline-none hover:text-label cursor-pointer max-w-[150px] truncate"
                    >
                      <option value="">Sem categoria</option>
                      {categories.filter((c) => c.type === t.type).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <span>·</span>
                    <span className="truncate">{t.account?.name}</span>
                  </div>
                </div>
                <p className={`tabular font-semibold text-[15px] ${t.type === "income" ? "text-ios-green" : ""}`}>
                  {t.type === "income" ? "+" : "−"}
                  {money(t.amount)}
                </p>
                {t.source === "manual" && (
                  <button
                    onClick={() => confirm("Excluir esta transação?") && start(() => deleteTransaction(t.id))}
                    className="p-2 rounded-full text-label-3 hover:text-ios-red hover:bg-ios-red/10 lg:opacity-0 group-hover:opacity-100 transition"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
