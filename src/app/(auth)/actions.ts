"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().email("E-mail inválido"),
  password: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres")
    .regex(/[A-Za-z]/, "A senha precisa ter letras")
    .regex(/\d/, "A senha precisa ter números"),
});

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Confirme seu e-mail antes de entrar."
          : "E-mail ou senha incorretos.",
    };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });
  if (error) {
    return {
      error:
        error.code === "user_already_exists"
          ? "Já existe uma conta com este e-mail."
          : error.message,
    };
  }
  if (data.session) redirect("/dashboard");
  return { success: "Conta criada! Enviamos um link de confirmação para o seu e-mail." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
