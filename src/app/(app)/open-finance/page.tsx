import type { Metadata } from "next";
import { Landmark, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { pluggyEnabled } from "@/lib/openfinance";
import type { BankConnection } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { ConnectBank, ConnectionRow } from "./ConnectBank";

export const metadata: Metadata = { title: "Open Finance" };

export default async function OpenFinancePage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("bank_connections").select("*").order("created_at");
  const connections = (data ?? []) as BankConnection[];

  return (
    <>
      <PageHeader title="Open Finance" subtitle="Bancos conectados" />

      <section className="card mb-6 flex flex-col sm:flex-row gap-5 sm:items-center">
        <div className="icon-tile w-14 h-14 rounded-2xl" style={{ background: "linear-gradient(145deg,#2b95ff,#0050c8)" }}>
          <Landmark size={28} color="white" />
        </div>
        <div className="flex-1">
          <h2 className="text-[17px] font-semibold">Conecte seus bancos</h2>
          <p className="text-label-2 text-[15px] mt-1">
            Importamos contas, saldos e transações pelo Open Finance Brasil via Pluggy. Você autoriza no ambiente do seu
            banco; o TabDin nunca vê sua senha bancária.
          </p>
          <p className="text-label-3 text-[13px] mt-2 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-ios-green" /> Acesso somente leitura · regulado pelo Banco Central
          </p>
        </div>
        <ConnectBank pluggyEnabled={pluggyEnabled()} />
      </section>

      <p className="section-label">Conexões</p>
      <div className="ios-list">
        {connections.length === 0 && (
          <p className="p-5 text-label-2 text-[15px]">
            Nenhum banco conectado ainda.
            {!pluggyEnabled() && " Experimente o Banco Demo para ver o app com dados de exemplo."}
          </p>
        )}
        {connections.map((c) => (
          <ConnectionRow key={c.id} connection={c} />
        ))}
      </div>
    </>
  );
}
