import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { Vault } from "./Vault";

export const metadata: Metadata = { title: "Cofre de senhas" };

export default async function VaultPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("vault_salt, vault_verifier, vault_verifier_iv")
    .eq("id", user.id)
    .single();

  return (
    <Vault
      userId={user.id}
      config={
        data?.vault_salt && data.vault_verifier && data.vault_verifier_iv
          ? { salt: data.vault_salt, verifier: data.vault_verifier, verifierIv: data.vault_verifier_iv }
          : null
      }
    />
  );
}
