"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  checkVerifier,
  createVerifier,
  decryptJSON,
  deriveKey,
  encryptJSON,
  newSalt,
  passwordStrength,
} from "@/lib/crypto/vault";
import type { CardSecret, LoginSecret, VaultRow } from "@/lib/types";
import { EmptyState, PageHeader, Sheet } from "@/components/ui";
import { VaultItemForm } from "./VaultItemForm";

const AUTO_LOCK_MS = 5 * 60 * 1000;

type Decrypted =
  | (Omit<VaultRow, "ciphertext" | "iv"> & { kind: "login"; data: LoginSecret })
  | (Omit<VaultRow, "ciphertext" | "iv"> & { kind: "card"; data: CardSecret });

interface Config {
  salt: string;
  verifier: string;
  verifierIv: string;
}

export function Vault({ userId, config: initialConfig }: { userId: string; config: Config | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [config, setConfig] = useState(initialConfig);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [items, setItems] = useState<Decrypted[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "login" | "card">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Decrypted | "new-login" | "new-card" | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback(() => {
    setKey(null);
    setItems([]);
  }, []);

  // Bloqueio automático por inatividade e ao fechar/ocultar a aba por muito tempo
  useEffect(() => {
    if (!key) return;
    const reset = () => {
      if (lockTimer.current) clearTimeout(lockTimer.current);
      lockTimer.current = setTimeout(lock, AUTO_LOCK_MS);
    };
    reset();
    const events = ["mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [key, lock]);

  const load = useCallback(
    async (k: CryptoKey) => {
      setLoading(true);
      const { data, error } = await supabase
        .from("vault_items")
        .select("*")
        .order("favorite", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) {
        setLoading(false);
        return;
      }
      const out: Decrypted[] = [];
      for (const row of data as VaultRow[]) {
        try {
          const secret = await decryptJSON<LoginSecret | CardSecret>(k, row.ciphertext, row.iv);
          out.push({
            id: row.id,
            kind: row.kind,
            favorite: row.favorite,
            created_at: row.created_at,
            updated_at: row.updated_at,
            data: secret,
          } as Decrypted);
        } catch {
          // item corrompido ou cifrado com outra chave — ignora
        }
      }
      setItems(out);
      setLoading(false);
    },
    [supabase],
  );

  async function save(kind: "login" | "card", data: LoginSecret | CardSecret, id?: string) {
    if (!key) return;
    const payload = await encryptJSON(key, data);
    if (id) {
      await supabase.from("vault_items").update(payload).eq("id", id);
    } else {
      await supabase.from("vault_items").insert({ kind, ...payload });
    }
    setEditing(null);
    await load(key);
  }

  async function remove(id: string) {
    if (!key || !confirm("Excluir este item do cofre?")) return;
    await supabase.from("vault_items").delete().eq("id", id);
    setItems((list) => list.filter((i) => i.id !== id));
  }

  async function toggleFavorite(item: Decrypted) {
    await supabase.from("vault_items").update({ favorite: !item.favorite }).eq("id", item.id);
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, favorite: !i.favorite } : i)));
  }

  if (!config) {
    return (
      <SetupVault
        onCreate={async (master) => {
          const salt = newSalt();
          const k = await deriveKey(master, salt);
          const v = await createVerifier(k);
          const { error } = await supabase
            .from("profiles")
            .update({ vault_salt: salt, vault_verifier: v.ciphertext, vault_verifier_iv: v.iv })
            .eq("id", userId);
          if (error) throw new Error("Não foi possível criar o cofre.");
          setConfig({ salt, verifier: v.ciphertext, verifierIv: v.iv });
          setKey(k);
          setItems([]);
        }}
      />
    );
  }

  if (!key) {
    return (
      <UnlockVault
        onUnlock={async (master) => {
          const k = await deriveKey(master, config.salt);
          if (!(await checkVerifier(k, config.verifier, config.verifierIv))) return false;
          setKey(k);
          await load(k);
          return true;
        }}
      />
    );
  }

  const q = query.trim().toLowerCase();
  const visible = items.filter(
    (i) =>
      (filter === "all" || i.kind === filter) &&
      (!q ||
        i.data.title.toLowerCase().includes(q) ||
        (i.kind === "login" && (i.data.username.toLowerCase().includes(q) || i.data.url?.toLowerCase().includes(q)))),
  );

  return (
    <>
      <PageHeader
        title="Cofre"
        subtitle="Senhas e cartões"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={lock}>
              <Lock size={17} /> Bloquear
            </button>
            <button className="btn-primary" onClick={() => setEditing(filter === "card" ? "new-card" : "new-login")}>
              <Plus size={18} /> Novo
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="segmented">
          {([["all", "Todos"], ["login", "Logins"], ["card", "Cartões"]] as const).map(([v, l]) => (
            <button key={v} data-active={filter === v} onClick={() => setFilter(v)}>
              {l}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-label-3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar no cofre…" className="field h-10 rounded-full pl-11" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-label-3">
          <Loader2 className="animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<KeyRound size={26} />}
          title={items.length ? "Nada encontrado" : "Seu cofre está vazio"}
          text={items.length ? "Tente outra busca." : "Guarde logins e cartões com criptografia ponta a ponta."}
          action={
            !items.length && (
              <div className="flex gap-2 justify-center">
                <button className="btn-primary" onClick={() => setEditing("new-login")}>
                  <Globe size={17} /> Login
                </button>
                <button className="btn-secondary" onClick={() => setEditing("new-card")}>
                  <CreditCard size={17} /> Cartão
                </button>
              </div>
            )
          }
        />
      ) : (
        <div className="space-y-8">
          {visible.some((i) => i.kind === "card") && (
            <section>
              <p className="section-label">Cartões</p>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visible.filter((i) => i.kind === "card").map((i) => (
                  <WalletCard
                    key={i.id}
                    item={i as Extract<Decrypted, { kind: "card" }>}
                    onEdit={() => setEditing(i)}
                    onDelete={() => remove(i.id)}
                    onFavorite={() => toggleFavorite(i)}
                  />
                ))}
              </div>
            </section>
          )}
          {visible.some((i) => i.kind === "login") && (
            <section>
              <p className="section-label">Logins</p>
              <div className="ios-list">
                {visible.filter((i) => i.kind === "login").map((i) => (
                  <LoginRow
                    key={i.id}
                    item={i as Extract<Decrypted, { kind: "login" }>}
                    onEdit={() => setEditing(i)}
                    onDelete={() => remove(i.id)}
                    onFavorite={() => toggleFavorite(i)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <p className="text-label-3 text-[13px] mt-8 flex items-center gap-1.5 justify-center">
        <ShieldCheck size={14} className="text-ios-green" /> AES-256-GCM · chave derivada no seu dispositivo · bloqueio automático em 5 min
      </p>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing === "new-login" ? "Novo login" : editing === "new-card" ? "Novo cartão" : editing?.kind === "card" ? "Editar cartão" : "Editar login"
        }
      >
        {editing && (
          <VaultItemForm
            kind={typeof editing === "string" ? (editing === "new-card" ? "card" : "login") : editing.kind}
            initial={typeof editing === "string" ? undefined : editing.data}
            onSubmit={(kind, data) => save(kind, data, typeof editing === "string" ? undefined : editing.id)}
          />
        )}
      </Sheet>
    </>
  );
}

/* ---------------- Telas de configuração / desbloqueio ---------------- */

function LockScreen({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-[400px] text-center animate-sheet">
        <div
          className="mx-auto mb-6 w-20 h-20 rounded-[24px] flex items-center justify-center"
          style={{
            background: "linear-gradient(145deg, #2b95ff 0%, #0050c8 55%, #1a237e 100%)",
            boxShadow: "0 20px 40px -12px rgba(10,132,255,.7), inset 0 1px 0 rgba(255,255,255,.3)",
          }}
        >
          <LockKeyhole size={36} color="white" />
        </div>
        <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
        <p className="text-label-2 mt-2 mb-7 text-[15px]">{text}</p>
        {children}
      </div>
    </div>
  );
}

function UnlockVault({ onUnlock }: { onUnlock: (pw: string) => Promise<boolean> }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <LockScreen title="Cofre bloqueado" text="Digite sua senha mestra para acessar seus logins e cartões.">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(false);
          const ok = await onUnlock(pw);
          if (!ok) {
            setError(true);
            setPw("");
          }
          setBusy(false);
        }}
      >
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className={`field text-center h-14 text-[18px] ${error ? "border-ios-red animate-[sheet-up_.2s]" : ""}`}
          placeholder="Senha mestra"
          autoComplete="current-password"
          autoFocus
          required
        />
        {error && <p className="text-ios-red text-[14px]">Senha mestra incorreta.</p>}
        <button className="btn-primary w-full h-12" disabled={busy || !pw}>
          {busy && <Loader2 size={18} className="animate-spin" />} Desbloquear
        </button>
      </form>
    </LockScreen>
  );
}

function SetupVault({ onCreate }: { onCreate: (pw: string) => Promise<void> }) {
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const strength = passwordStrength(pw);

  return (
    <LockScreen
      title="Crie seu cofre"
      text="Defina uma senha mestra. Ela cifra seus dados no seu dispositivo — nem o TabDin consegue lê-los."
    >
      <form
        className="space-y-3 text-left"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 10) return setError("Use pelo menos 10 caracteres.");
          if (pw !== confirmPw) return setError("As senhas não conferem.");
          setBusy(true);
          setError(null);
          try {
            await onCreate(pw);
          } catch (err) {
            setError((err as Error).message);
            setBusy(false);
          }
        }}
      >
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="field" placeholder="Senha mestra (mín. 10 caracteres)" autoComplete="new-password" required />
        {pw && (
          <div className="px-1">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${strength.pct}%`, background: strength.color }} />
            </div>
            <p className="text-[12px] mt-1 text-label-2">Força: {strength.label}</p>
          </div>
        )}
        <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="field" placeholder="Confirme a senha mestra" autoComplete="new-password" required />
        <label className="flex gap-3 items-start text-[14px] text-label-2 px-1 py-2 cursor-pointer">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 accent-[#0a84ff]" />
          Entendo que, se eu esquecer a senha mestra, os itens do cofre não poderão ser recuperados.
        </label>
        {error && <p className="text-ios-red text-[14px]">{error}</p>}
        <button className="btn-primary w-full h-12" disabled={busy || !ack}>
          {busy && <Loader2 size={18} className="animate-spin" />} Criar cofre
        </button>
      </form>
    </LockScreen>
  );
}

/* ---------------- Itens ---------------- */

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
    // limpa a área de transferência após 30s (melhor esforço)
    setTimeout(() => navigator.clipboard.writeText("").catch(() => {}), 30_000);
  };
  return { copied, copy };
}

function IconBtn({ onClick, label, children, danger }: { onClick: () => void; label: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 rounded-full transition ${danger ? "text-label-3 hover:text-ios-red hover:bg-ios-red/10" : "text-label-2 hover:text-label hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}

function LoginRow({
  item,
  onEdit,
  onDelete,
  onFavorite,
}: {
  item: Extract<Decrypted, { kind: "login" }>;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
}) {
  const [show, setShow] = useState(false);
  const { copied, copy } = useCopy();
  const d = item.data;
  let host = "";
  try {
    host = d.url ? new URL(d.url.startsWith("http") ? d.url : `https://${d.url}`).hostname : "";
  } catch {}

  return (
    <div className="ios-row flex-wrap sm:flex-nowrap">
      <div className="icon-tile w-10 h-10 bg-gradient-to-br from-ios-blue to-ios-indigo text-white font-semibold text-[16px]">
        {d.title.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium truncate flex items-center gap-1.5">
          {d.title}
          {item.favorite && <Star size={13} className="text-ios-yellow fill-ios-yellow" />}
        </p>
        <p className="text-[13px] text-label-3 truncate">
          {d.username}
          {host && ` · ${host}`}
        </p>
        <p className="font-mono text-[13px] text-label-2 mt-0.5 truncate">{show ? d.password : "••••••••••••"}</p>
      </div>
      <div className="flex items-center">
        <IconBtn onClick={() => copy("user", d.username)} label="Copiar usuário">
          {copied === "user" ? <Check size={16} className="text-ios-green" /> : <Copy size={16} />}
        </IconBtn>
        <IconBtn onClick={() => setShow((s) => !s)} label={show ? "Ocultar senha" : "Mostrar senha"}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </IconBtn>
        <IconBtn onClick={() => copy("pw", d.password)} label="Copiar senha">
          {copied === "pw" ? <Check size={16} className="text-ios-green" /> : <KeyRound size={16} />}
        </IconBtn>
        <IconBtn onClick={onFavorite} label="Favorito">
          <Star size={16} className={item.favorite ? "text-ios-yellow fill-ios-yellow" : ""} />
        </IconBtn>
        <IconBtn onClick={onEdit} label="Editar">
          <Pencil size={16} />
        </IconBtn>
        <IconBtn onClick={onDelete} label="Excluir" danger>
          <Trash2 size={16} />
        </IconBtn>
      </div>
    </div>
  );
}

function brandOf(number: string, brand?: string) {
  if (brand) return brand;
  const n = number.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(n)) return "Elo";
  if (/^(606282|3841)/.test(n)) return "Hipercard";
  return "Cartão";
}

function WalletCard({
  item,
  onEdit,
  onDelete,
  onFavorite,
}: {
  item: Extract<Decrypted, { kind: "card" }>;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
}) {
  const [show, setShow] = useState(false);
  const { copied, copy } = useCopy();
  const d = item.data;
  const digits = d.number.replace(/\D/g, "");
  const masked = show ? digits.replace(/(.{4})/g, "$1 ").trim() : `•••• •••• •••• ${digits.slice(-4)}`;

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-[22px] p-5 aspect-[1.586] flex flex-col text-white border border-white/15"
        style={{
          background: "linear-gradient(135deg, #1b6dff 0%, #0b3a9e 45%, #071f5c 80%, #040d2b 100%)",
          boxShadow: "0 25px 50px -20px rgba(10,132,255,.55), inset 0 1px 0 rgba(255,255,255,.25)",
        }}
      >
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="flex justify-between items-start">
          <p className="font-semibold text-[16px] truncate pr-2">{d.title}</p>
          <p className="font-bold italic text-[15px] opacity-90">{brandOf(d.number, d.brand)}</p>
        </div>
        <div className="w-10 h-7 rounded-md mt-3 bg-gradient-to-br from-yellow-200/90 to-yellow-500/80" aria-hidden />
        <p className="font-mono text-[18px] sm:text-[20px] tracking-[0.12em] mt-auto tabular">{masked}</p>
        <div className="flex justify-between items-end mt-2 text-[12px]">
          <div className="min-w-0">
            <p className="opacity-60 text-[10px] uppercase">Titular</p>
            <p className="uppercase truncate">{d.holder}</p>
          </div>
          <div className="text-right shrink-0 pl-3">
            <p className="opacity-60 text-[10px] uppercase">Validade · CVV</p>
            <p className="tabular">
              {d.expiry} · {show ? d.cvv : "•••"}
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-2">
        <IconBtn onClick={() => setShow((s) => !s)} label={show ? "Ocultar dados" : "Mostrar dados"}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </IconBtn>
        <IconBtn onClick={() => copy("num", digits)} label="Copiar número">
          {copied === "num" ? <Check size={16} className="text-ios-green" /> : <Copy size={16} />}
        </IconBtn>
        <IconBtn onClick={onFavorite} label="Favorito">
          <Star size={16} className={item.favorite ? "text-ios-yellow fill-ios-yellow" : ""} />
        </IconBtn>
        <IconBtn onClick={onEdit} label="Editar">
          <Pencil size={16} />
        </IconBtn>
        <IconBtn onClick={onDelete} label="Excluir" danger>
          <Trash2 size={16} />
        </IconBtn>
      </div>
    </div>
  );
}
