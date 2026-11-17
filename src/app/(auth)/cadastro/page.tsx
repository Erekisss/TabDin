import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
