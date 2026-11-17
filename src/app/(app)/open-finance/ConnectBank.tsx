"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FlaskConical, Landmark, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { deleteConnection } from "../actions";
import type { BankConnection } from "@/lib/types";

// O widget usa window/iframes — carregado apenas no navegador.
const PluggyConnect = dynamic(() => import("react-pluggy-connect").then((m) => m.PluggyConnect), { ssr: false });

async function sync(body: { itemId?: string; demo?: boolean }) {
  const res = await fetch("/api/open-finance/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Falha na sincronização");
  return json as { accounts: number; transactions: number };
}

export function ConnectBank({ pluggyEnabled }: { pluggyEnabled: boolean }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState<"connect" | "demo" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function openWidget() {
    setBusy("connect");
    setMessage(null);
    try {
      const res = await fetch("/api/open-finance/connect-token", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setToken(json.accessToken);
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message || "Não foi possível abrir o Open Finance" });
      setBusy(null);
    }
  }

  async function run(body: { itemId?: string; demo?: boolean }) {
    try {
      const r = await sync(body);
      setMessage({ ok: true, text: `${r.accounts} contas e ${r.transactions} transações sincronizadas.` });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {pluggyEnabled && (
          <button className="btn-primary" onClick={openWidget} disabled={!!busy}>
            {busy === "connect" ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Conectar banco
          </button>
        )}
        <button
          className={pluggyEnabled ? "btn-secondary" : "btn-primary"}
          disabled={!!busy}
          onClick={() => {
            setBusy("demo");
            setMessage(null);
            run({ demo: true });
          }}
        >
          {busy === "demo" ? <Loader2 size={18} className="animate-spin" /> : <FlaskConical size={18} />} Banco Demo
        </button>
      </div>
      {message && (
        <p className={`text-[13px] ${message.ok ? "text-ios-green" : "text-ios-red"}`}>{message.text}</p>
      )}

      {token && (
        <PluggyConnect
          connectToken={token}
          includeSandbox
          theme="dark"
          language="pt"
          countries={["BR"]}
          onSuccess={({ item }) => {
            setToken(null);
            run({ itemId: item.id });
          }}
          onError={(err) => {
            setMessage({ ok: false, text: err.message });
          }}
          onClose={() => {
            setToken(null);
            setBusy((b) => (b === "connect" ? null : b));
          }}
        />
      )}
    </div>
  );
}

export function ConnectionRow({ connection: c }: { connection: BankConnection }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [pending, start] = useTransition();

  async function resync() {
    setSyncing(true);
    try {
      await sync(c.provider === "demo" ? { demo: true } : { itemId: c.external_item_id });
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="ios-row">
      {c.institution_logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.institution_logo} alt="" className="w-10 h-10 rounded-[10px] bg-white object-contain p-1" />
      ) : (
        <div className="icon-tile w-10 h-10" style={{ background: c.institution_color ?? "#0A84FF" }}>
          <Landmark size={20} color="white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium truncate">{c.institution_name}</p>
        <p className="text-[13px] text-label-3">
          {c.last_sync_at
            ? `Sincronizado ${new Date(c.last_sync_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`
            : "Nunca sincronizado"}
        </p>
      </div>
      <button onClick={resync} disabled={syncing} className="p-2 rounded-full text-ios-blue hover:bg-ios-blue/10" aria-label="Sincronizar">
        <RefreshCw size={17} className={syncing ? "animate-spin" : ""} />
      </button>
      <button
        disabled={pending}
        onClick={() =>
          confirm(`Desconectar ${c.institution_name}? Contas e transações importadas serão removidas.`) &&
          start(() => deleteConnection(c.id))
        }
        className="p-2 rounded-full text-label-3 hover:text-ios-red hover:bg-ios-red/10"
        aria-label="Desconectar"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}
