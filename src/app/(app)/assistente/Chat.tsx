"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, CalendarRange, PiggyBank, Repeat, RotateCcw, Sparkles, Wallet } from "lucide-react";
import { LogoMark } from "@/components/Logo";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  { icon: Wallet, text: "Quanto eu tenho de saldo?" },
  { icon: CalendarRange, text: "Compare meus gastos com o mês passado" },
  { icon: Repeat, text: "Quais assinaturas eu pago?" },
  { icon: PiggyBank, text: "Onde eu mais gastei este mês?" },
];

/** Markdown mínimo e seguro: **negrito**, _itálico_, `código`, listas "- " e quebras de linha. */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold text-label">{p.slice(2, -2)}</strong>;
    if (p.startsWith("_") && p.endsWith("_") && p.length > 2) return <em key={i} className="text-label-3">{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="font-mono text-[13px] bg-white/10 rounded px-1">{p.slice(1, -1)}</code>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={i} className="space-y-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                  <span>{renderInline(l.replace(/^\s*[-•]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function Chat({ ai }: { ai: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-20) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao falar com o Din");
      setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-180px)] lg:min-h-[calc(100dvh-80px)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <LogoMark size={44} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-ios-green border-2 border-bg" />
          </div>
          <div>
            <h1 className="font-display text-[22px] font-bold tracking-tight leading-none">Din</h1>
            <p className="text-[13px] text-label-3 mt-1">Seu assistente financeiro{ai ? " · IA" : " · modo básico"}</p>
          </div>
        </div>
        {!empty && (
          <button className="btn-secondary h-9 px-4 text-[13px]" onClick={() => setMessages([])}>
            <RotateCcw size={14} /> Nova conversa
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 pb-4">
        {empty && (
          <div className="pt-10 sm:pt-16 text-center animate-sheet">
            <div className="inline-flex relative mb-6">
              <div className="absolute -inset-6 bg-brand opacity-25 blur-3xl rounded-full" />
              <div className="relative"><LogoMark size={84} /></div>
            </div>
            <h2 className="font-display text-[30px] sm:text-[38px] font-bold tracking-[-0.035em] leading-tight">
              Pergunte qualquer coisa
              <br />
              <span className="text-brand">sobre o seu dinheiro.</span>
            </h2>
            <p className="text-label-2 mt-3">Eu leio suas contas e transações do Open Finance e respondo na hora.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-9 text-left">
              {SUGGESTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => send(text)}
                  className="card border-brand p-4 flex items-center gap-3 text-[15px] hover:-translate-y-0.5 transition text-left"
                >
                  <span className="icon-tile w-9 h-9 rounded-xl bg-brand">
                    <Icon size={17} color="#03140f" />
                  </span>
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end animate-fade">
              <div className="max-w-[85%] rounded-[22px] rounded-br-md px-4 py-2.5 text-[15px] text-[#03140f] font-medium bg-brand shadow-[0_8px_24px_-12px_rgba(25,198,255,.7)]">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5 items-end animate-fade">
              <LogoMark size={28} />
              <div className="max-w-[85%] glass rounded-[22px] rounded-bl-md px-4 py-3 text-[15px] leading-relaxed text-label-2">
                <Markdown text={m.content} />
              </div>
            </div>
          ),
        )}

        {loading && (
          <div className="flex gap-2.5 items-end">
            <LogoMark size={28} />
            <div className="glass rounded-[22px] rounded-bl-md px-4 py-3.5 flex gap-1.5" aria-label="Din está pensando">
              {[0, 1, 2].map((d) => (
                <span key={d} className="w-2 h-2 rounded-full bg-brand-2 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-center text-[14px] text-ios-red">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        className="sticky bottom-[76px] lg:bottom-4 z-20"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="glass border-brand rounded-[26px] p-2 pl-5 flex items-end gap-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,.9)]">
          <Sparkles size={18} className="text-brand-2 mb-3 shrink-0" />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Pergunte ao Din…"
            className="flex-1 bg-transparent outline-none resize-none py-2.5 text-[16px] placeholder:text-label-3 max-h-32"
          />
          <button
            className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0 disabled:opacity-40 transition active:scale-95"
            disabled={!input.trim() || loading}
            aria-label="Enviar"
          >
            <ArrowUp size={20} color="#03140f" strokeWidth={2.6} />
          </button>
        </div>
      </form>
    </div>
  );
}
