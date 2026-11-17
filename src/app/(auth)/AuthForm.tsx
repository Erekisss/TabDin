"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp } from "./actions";
import { Logo } from "@/components/Logo";

export function AuthForm({
  mode,
  next,
  notice,
}: {
  mode: "login" | "signup";
  next?: string;
  notice?: string;
}) {
  const [state, action, pending] = useActionState(mode === "login" ? signIn : signUp, undefined);
  const [show, setShow] = useState(false);
  const isLogin = mode === "login";
  const error = state?.error ?? notice;

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[400px] animate-sheet">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo size={44} />
          </Link>
        </div>
        <div className="card p-7">
          <h1 className="text-[28px] font-bold tracking-tight">
            {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
          </h1>
          <p className="text-label-2 mt-1 mb-6 text-[15px]">
            {isLogin
              ? "Entre com seu e-mail e senha."
              : "Cada conta tem sua própria senha e seus próprios dados."}
          </p>

          <form action={action} className="space-y-4">
            {next && <input type="hidden" name="next" value={next} />}
            {!isLogin && (
              <div>
                <label className="field-label" htmlFor="full_name">
                  Nome
                </label>
                <input id="full_name" name="full_name" className="field" autoComplete="name" required />
              </div>
            )}
            <div>
              <label className="field-label" htmlFor="email">
                E-mail
              </label>
              <input id="email" name="email" type="email" className="field" autoComplete="email" required />
            </div>
            <div>
              <label className="field-label" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={show ? "text" : "password"}
                  className="field pr-12"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  minLength={isLogin ? undefined : 8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-label-3 hover:text-label p-1"
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-[12px] text-label-3 mt-1.5 px-1">
                  Mínimo 8 caracteres, com letras e números.
                </p>
              )}
            </div>

            {error && (
              <p className="text-[14px] text-ios-red bg-ios-red/10 rounded-xl px-3 py-2">{error}</p>
            )}
            {state?.success && (
              <p className="text-[14px] text-ios-green bg-ios-green/10 rounded-xl px-3 py-2">
                {state.success}
              </p>
            )}

            <button className="btn-primary w-full h-12" disabled={pending}>
              {pending && <Loader2 size={18} className="animate-spin" />}
              {isLogin ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>

        <p className="text-center text-label-2 text-[15px] mt-6">
          {isLogin ? "Ainda não tem conta? " : "Já tem uma conta? "}
          <Link href={isLogin ? "/cadastro" : "/login"} className="text-ios-blue font-semibold">
            {isLogin ? "Cadastre-se" : "Entrar"}
          </Link>
        </p>
      </div>
    </main>
  );
}
