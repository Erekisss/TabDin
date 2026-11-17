"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createAccount, deleteAccount } from "../actions";
import { ACCOUNT_TYPE_LABEL, type ActionState } from "@/lib/types";
import { Sheet } from "@/components/ui";

const COLORS = ["#0A84FF", "#5E5CE6", "#3A8DDE", "#1F4FBF", "#30D158", "#FF9F0A", "#FF453A", "#BF5AF2"];

export function NewAccountButton() {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await createAccount(prev, fd);
    if (result?.success) setOpen(false);
    return result;
  }, undefined);

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} /> Nova conta
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nova conta manual">
        <form action={action} className="space-y-4">
          <div>
            <label className="field-label" htmlFor="a-name">Nome</label>
            <input id="a-name" name="name" className="field" placeholder="Ex.: Nubank" required maxLength={60} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="a-type">Tipo</label>
              <select id="a-type" name="type" className="field">
                {Object.entries(ACCOUNT_TYPE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="a-inst">Instituição</label>
              <input id="a-inst" name="institution" className="field" maxLength={60} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="a-bal">Saldo inicial (R$)</label>
            <input id="a-bal" name="balance" inputMode="decimal" className="field tabular" placeholder="0,00" />
          </div>
          <div>
            <span className="field-label">Cor</span>
            <input type="hidden" name="color" value={color} />
            <div className="flex gap-2.5 px-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition"
                  style={{ background: c, outline: color === c ? "2px solid white" : "none", outlineOffset: 2 }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>
          {state?.error && <p className="text-[14px] text-ios-red">{state.error}</p>}
          <button className="btn-primary w-full h-12" disabled={pending}>
            {pending && <Loader2 size={18} className="animate-spin" />} Criar conta
          </button>
        </form>
      </Sheet>
    </>
  );
}

export function DeleteAccountButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => confirm(`Excluir a conta "${name}" e todas as suas transações?`) && start(() => deleteAccount(id))}
      className="p-2 rounded-full text-label-3 hover:text-ios-red hover:bg-ios-red/10"
      aria-label="Excluir conta"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  );
}
