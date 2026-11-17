"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Wand2 } from "lucide-react";
import { generatePassword, passwordStrength } from "@/lib/crypto/vault";
import type { CardSecret, LoginSecret } from "@/lib/types";

type Props =
  | { kind: "login"; initial?: LoginSecret | CardSecret; onSubmit: (kind: "login" | "card", data: LoginSecret | CardSecret) => Promise<void> }
  | { kind: "card"; initial?: LoginSecret | CardSecret; onSubmit: (kind: "login" | "card", data: LoginSecret | CardSecret) => Promise<void> };

export function VaultItemForm({ kind, initial, onSubmit }: Props) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        const get = (k: string) => String(f.get(k) ?? "").trim();
        const data: LoginSecret | CardSecret =
          kind === "login"
            ? { title: get("title"), url: get("url"), username: get("username"), password: String(f.get("password") ?? ""), notes: get("notes") }
            : {
                title: get("title"),
                holder: get("holder"),
                number: get("number").replace(/\D/g, ""),
                expiry: get("expiry"),
                cvv: get("cvv"),
                pin: get("pin"),
                notes: get("notes"),
              };
        try {
          await onSubmit(kind, data);
        } finally {
          setBusy(false);
        }
      }}
    >
      {kind === "login" ? <LoginFields initial={initial as LoginSecret | undefined} /> : <CardFields initial={initial as CardSecret | undefined} />}
      <div>
        <label className="field-label" htmlFor="v-notes">Notas</label>
        <textarea id="v-notes" name="notes" defaultValue={initial?.notes} className="field h-20 py-3 resize-none" maxLength={1000} />
      </div>
      <button className="btn-primary w-full h-12" disabled={busy}>
        {busy && <Loader2 size={18} className="animate-spin" />} Salvar no cofre
      </button>
    </form>
  );
}

function LoginFields({ initial }: { initial?: LoginSecret }) {
  const [password, setPassword] = useState(initial?.password ?? "");
  const [show, setShow] = useState(false);
  const [length, setLength] = useState(20);
  const strength = passwordStrength(password);

  return (
    <>
      <div>
        <label className="field-label" htmlFor="v-title">Nome</label>
        <input id="v-title" name="title" defaultValue={initial?.title} className="field" placeholder="Ex.: Gmail" required maxLength={80} />
      </div>
      <div>
        <label className="field-label" htmlFor="v-url">Site</label>
        <input id="v-url" name="url" defaultValue={initial?.url} className="field" placeholder="gmail.com" maxLength={300} />
      </div>
      <div>
        <label className="field-label" htmlFor="v-user">Usuário ou e-mail</label>
        <input id="v-user" name="username" defaultValue={initial?.username} className="field" autoComplete="off" required maxLength={200} />
      </div>
      <div>
        <label className="field-label" htmlFor="v-pw">Senha</label>
        <div className="relative">
          <input
            id="v-pw"
            name="password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field pr-12 font-mono"
            autoComplete="new-password"
            required
            maxLength={500}
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-label-3 hover:text-label p-1" aria-label="Mostrar senha">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {password && (
          <div className="px-1 mt-2">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${strength.pct}%`, background: strength.color }} />
            </div>
            <p className="text-[12px] mt-1 text-label-2">Força: {strength.label}</p>
          </div>
        )}
        <div className="flex items-center gap-3 mt-3 glass rounded-2xl p-3">
          <button
            type="button"
            onClick={() => {
              setPassword(generatePassword(length));
              setShow(true);
            }}
            className="btn-secondary h-9 px-4 text-[14px]"
          >
            <Wand2 size={15} /> Gerar
          </button>
          <input type="range" min={12} max={40} value={length} onChange={(e) => setLength(Number(e.target.value))} className="flex-1 accent-[#0a84ff]" aria-label="Tamanho da senha" />
          <span className="text-[13px] text-label-2 tabular w-6 text-right">{length}</span>
        </div>
      </div>
    </>
  );
}

function CardFields({ initial }: { initial?: CardSecret }) {
  const [number, setNumber] = useState(initial?.number?.replace(/(\d{4})(?=\d)/g, "$1 ") ?? "");
  const [expiry, setExpiry] = useState(initial?.expiry ?? "");

  return (
    <>
      <div>
        <label className="field-label" htmlFor="v-title">Apelido</label>
        <input id="v-title" name="title" defaultValue={initial?.title} className="field" placeholder="Ex.: Nubank Ultravioleta" required maxLength={80} />
      </div>
      <div>
        <label className="field-label" htmlFor="v-holder">Nome no cartão</label>
        <input id="v-holder" name="holder" defaultValue={initial?.holder} className="field uppercase" autoComplete="off" required maxLength={80} />
      </div>
      <div>
        <label className="field-label" htmlFor="v-number">Número</label>
        <input
          id="v-number"
          name="number"
          value={number}
          onChange={(e) =>
            setNumber(
              e.target.value
                .replace(/\D/g, "")
                .slice(0, 19)
                .replace(/(\d{4})(?=\d)/g, "$1 "),
            )
          }
          inputMode="numeric"
          className="field font-mono tabular"
          placeholder="0000 0000 0000 0000"
          autoComplete="off"
          required
          minLength={13}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="field-label" htmlFor="v-exp">Validade</label>
          <input
            id="v-exp"
            name="expiry"
            value={expiry}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 4);
              setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
            }}
            inputMode="numeric"
            className="field tabular"
            placeholder="MM/AA"
            autoComplete="off"
            required
            pattern="(0[1-9]|1[0-2])/\d{2}"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="v-cvv">CVV</label>
          <input id="v-cvv" name="cvv" defaultValue={initial?.cvv} inputMode="numeric" className="field tabular" autoComplete="off" required pattern="\d{3,4}" maxLength={4} />
        </div>
        <div>
          <label className="field-label" htmlFor="v-pin">Senha</label>
          <input id="v-pin" name="pin" type="password" defaultValue={initial?.pin} inputMode="numeric" className="field tabular" autoComplete="off" maxLength={8} />
        </div>
      </div>
    </>
  );
}
