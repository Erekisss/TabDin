"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

const uuid = z.string().uuid();

/** Aceita "1234.56", "1234,56" e "1.234,56". */
function parseMoney(v: unknown) {
  if (typeof v !== "string") return v;
  const t = v.trim().replace(/[R$\s]/g, "");
  if (t === "") return 0;
  return Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
}

const money = z.preprocess(
  parseMoney,
  z.number({ message: "Valor inválido" }).finite().min(0, "Valor inválido"),
);

function refresh() {
  revalidatePath("/", "layout");
}

/* ---------------- Transações ---------------- */

const txSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição").max(140),
  amount: money.refine((n) => n > 0, "Informe um valor maior que zero"),
  type: z.enum(["income", "expense"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  account_id: uuid,
  category_id: z.union([uuid, z.literal("")]).transform((v) => v || null),
  notes: z.string().trim().max(500).optional().transform((v) => v || null),
});

export async function createTransaction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = txSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    date: formData.get("date"),
    account_id: formData.get("account_id"),
    category_id: formData.get("category_id") ?? "",
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("transactions").insert({ ...parsed.data, source: "manual" });
  if (error) return { error: "Não foi possível salvar a transação." };
  refresh();
  return { success: "Transação adicionada" };
}

export async function deleteTransaction(id: string) {
  if (!uuid.safeParse(id).success) return;
  const { supabase } = await requireUser();
  await supabase.from("transactions").delete().eq("id", id);
  refresh();
}

export async function updateTransactionCategory(id: string, categoryId: string | null) {
  if (!uuid.safeParse(id).success) return;
  if (categoryId && !uuid.safeParse(categoryId).success) return;
  const { supabase } = await requireUser();
  await supabase.from("transactions").update({ category_id: categoryId }).eq("id", id);
  refresh();
}

/* ---------------- Contas ---------------- */

const accountSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(60),
  institution: z.string().trim().max(60).optional().transform((v) => v || null),
  type: z.enum(["checking", "savings", "credit", "investment", "wallet"]),
  balance: z.preprocess(
    parseMoney,
    z.number({ message: "Saldo inválido" }).finite(),
  ),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function createAccount(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    institution: formData.get("institution") ?? undefined,
    type: formData.get("type"),
    balance: formData.get("balance") ?? "0",
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("accounts").insert({ ...parsed.data, source: "manual" });
  if (error) return { error: "Não foi possível criar a conta." };
  refresh();
  return { success: "Conta criada" };
}

export async function deleteAccount(id: string) {
  if (!uuid.safeParse(id).success) return;
  const { supabase } = await requireUser();
  await supabase.from("accounts").delete().eq("id", id);
  refresh();
}

/* ---------------- Open Finance ---------------- */

export async function deleteConnection(id: string) {
  if (!uuid.safeParse(id).success) return;
  const { supabase } = await requireUser();
  await supabase.from("bank_connections").delete().eq("id", id);
  refresh();
}

/* ---------------- Orçamentos ---------------- */

export async function saveBudget(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ category_id: uuid, amount: money })
    .safeParse({ category_id: formData.get("category_id"), amount: formData.get("amount") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase } = await requireUser();
  const { category_id, amount } = parsed.data;
  const { error } =
    amount === 0
      ? await supabase.from("budgets").delete().eq("category_id", category_id)
      : await supabase.from("budgets").upsert({ category_id, amount }, { onConflict: "user_id,category_id" });
  if (error) return { error: "Não foi possível salvar o orçamento." };
  refresh();
  return { success: amount === 0 ? "Orçamento removido" : "Orçamento salvo" };
}
