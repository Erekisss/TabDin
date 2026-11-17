"use client";

import { useActionState, useState } from "react";
import { Plus, Target } from "lucide-react";
import { saveBudget } from "../actions";
import { money } from "@/lib/format";
import type { ActionState, Category } from "@/lib/types";
import { CategoryIcon, Sheet } from "@/components/ui";

interface Row {
  category: Category;
  amount: number;
  spent: number;
}

export function BudgetCard({ rows, categories }: { rows: Row[]; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await saveBudget(prev, fd);
    if (result?.success) setOpen(false);
    return result;
  }, undefined);

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <p className="section-label mb-0">Orçamentos do mês</p>
        <button onClick={() => setOpen(true)} className="text-ios-blue text-[14px] font-medium flex items-center gap-1">
          <Plus size={16} /> Definir
        </button>
      </div>
      <div className="ios-list">
        {rows.length === 0 && (
          <div className="p-5 flex items-center gap-3 text-label-2 text-[15px]">
            <Target size={20} className="text-ios-blue" /> Defina limites de gasto por categoria.
          </div>
        )}
        {rows.map(({ category, amount, spent }) => {
          const pct = Math.min(100, (spent / amount) * 100);
          const over = spent > amount;
          return (
            <div key={category.id} className="ios-row">
              <CategoryIcon icon={category.icon} color={category.color} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[14px] mb-1.5">
                  <span className="truncate">{category.name}</span>
                  <span className="tabular text-label-2">
                    {money(spent)} <span className="text-label-3">/ {money(amount)}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: over ? "var(--ios-red)" : pct > 80 ? "var(--ios-orange)" : "var(--ios-green)" }}
                  />
                </div>
                {over && <p className="text-[12px] text-ios-red mt-1">Acima do orçamento em {money(spent - amount)}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Orçamento mensal">
        <form action={action} className="space-y-4">
          <div>
            <label className="field-label" htmlFor="b-cat">Categoria</label>
            <select id="b-cat" name="category_id" className="field" required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="b-amount">Limite mensal (R$)</label>
            <input id="b-amount" name="amount" inputMode="decimal" className="field" placeholder="0,00" required />
            <p className="text-[12px] text-label-3 mt-1.5 px-1">Use 0 para remover o orçamento.</p>
          </div>
          {state?.error && <p className="text-[14px] text-ios-red">{state.error}</p>}
          <button className="btn-primary w-full" disabled={pending}>Salvar</button>
        </form>
      </Sheet>
    </section>
  );
}
