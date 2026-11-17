"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createTransaction } from "../actions";
import { todayISO } from "@/lib/format";
import type { Account, ActionState, Category, TxType } from "@/lib/types";
import { Sheet } from "@/components/ui";

export function NewTransactionButton({ accounts, categories }: { accounts: Account[]; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxType>("expense");
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await createTransaction(prev, fd);
    if (result?.success) {
      setOpen(false);
      setFormKey((k) => k + 1);
    }
    return result;
  }, undefined);

  const manualAccounts = accounts.filter((a) => a.source === "manual");

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} /> Nova
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nova transação">
        {manualAccounts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-label-2 mb-4">
              Lançamentos manuais precisam de uma conta manual. Contas do Open Finance são atualizadas pelo banco.
            </p>
            <Link href="/contas" className="btn-primary">Criar conta manual</Link>
          </div>
        ) : (
          <form key={formKey} action={action} className="space-y-4">
            <div className="segmented w-full grid grid-cols-2">
              <button type="button" data-active={type === "expense"} onClick={() => setType("expense")} className="justify-center">
                Despesa
              </button>
              <button type="button" data-active={type === "income"} onClick={() => setType("income")} className="justify-center">
                Receita
              </button>
            </div>
            <input type="hidden" name="type" value={type} />

            <div>
              <label className="field-label" htmlFor="t-amount">Valor (R$)</label>
              <input
                id="t-amount"
                name="amount"
                inputMode="decimal"
                placeholder="0,00"
                className="field text-[28px] h-16 font-bold tabular"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="t-desc">Descrição</label>
              <input id="t-desc" name="description" className="field" placeholder="Ex.: Mercado" required maxLength={140} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="t-cat">Categoria</label>
                <select id="t-cat" name="category_id" className="field">
                  <option value="">Sem categoria</option>
                  {categories.filter((c) => c.type === type).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="t-date">Data</label>
                <input id="t-date" name="date" type="date" defaultValue={todayISO()} className="field" required />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="t-acc">Conta</label>
              <select id="t-acc" name="account_id" className="field" required>
                {manualAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="t-notes">Observações</label>
              <input id="t-notes" name="notes" className="field" maxLength={500} />
            </div>
            {state?.error && <p className="text-[14px] text-ios-red">{state.error}</p>}
            <button className="btn-primary w-full h-12" disabled={pending}>
              {pending && <Loader2 size={18} className="animate-spin" />} Adicionar
            </button>
          </form>
        )}
      </Sheet>
    </>
  );
}
