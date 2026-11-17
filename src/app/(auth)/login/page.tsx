import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<AuthForm mode="login" />}>
      <LoginWithParams searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginWithParams({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next, erro } = await searchParams;
  return (
    <AuthForm
      mode="login"
      next={typeof next === "string" ? next : undefined}
      notice={erro === "link" ? "Link inválido ou expirado. Tente entrar novamente." : undefined}
    />
  );
}
