"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Home, Landmark, LockKeyhole, LogOut, Sparkles, Wallet } from "lucide-react";
import { Logo, LogoMark } from "./Logo";
import { signOut } from "@/app/(auth)/actions";

const items = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/assistente", label: "Din · Assistente IA", short: "Din", icon: Sparkles },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/open-finance", label: "Open Finance", short: "Bancos", icon: Landmark },
  { href: "/cofre", label: "Cofre", icon: LockKeyhole },
];

export function Sidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[260px] flex-col p-4 z-30">
      <div className="glass border-brand rounded-[30px] flex-1 flex flex-col p-4">
        <div className="px-2 py-3 mb-5">
          <Logo tagline />
        </div>
        <p className="section-label px-3">Menu</p>
        <nav className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 rounded-2xl px-3 h-11 text-[15px] font-medium transition ${
                  active
                    ? "text-label bg-gradient-to-r from-brand-2/20 via-brand-3/10 to-transparent"
                    : "text-label-2 hover:bg-white/[0.04] hover:text-label"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand shadow-[0_0_12px_rgba(25,198,255,.9)]" />
                )}
                <Icon size={19} strokeWidth={active ? 2.4 : 2} className={active ? "text-brand-2" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="flex items-center gap-3 rounded-2xl p-3 bg-bg-elevated/60 border border-separator">
            <div className="icon-tile w-9 h-9 rounded-full bg-brand text-[#03140f] text-[14px] font-bold">
              {name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold truncate">{name}</p>
              <p className="text-[12px] text-label-3 truncate">{email}</p>
            </div>
            <form action={signOut}>
              <button className="p-2 rounded-full text-label-3 hover:text-ios-red hover:bg-ios-red/10" aria-label="Sair">
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}

const TAB_ORDER = ["/dashboard", "/transacoes", "/assistente", "/open-finance", "/cofre"];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass border-x-0 border-b-0 rounded-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 h-[58px]">
        {TAB_ORDER.map((href) => items.find((i) => i.href === href)!).map(({ href, label, short, icon: Icon }) => {
          const active = pathname.startsWith(href);
          if (href === "/assistente") {
            return (
              <Link key={href} href={href} className="flex flex-col items-center justify-end pb-1.5 text-[10px] font-semibold" aria-label="Din, assistente">
                <span className={`-mt-6 mb-0.5 rounded-[18px] transition ${active ? "shadow-[0_0_24px_rgba(25,198,255,.8)]" : "shadow-[0_8px_20px_-6px_rgba(0,0,0,.8)]"}`}>
                  <LogoMark size={46} />
                </span>
                <span className={active ? "text-brand-2" : "text-label-3"}>Din</span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                active ? "text-brand-2" : "text-label-3"
              }`}
            >
              <Icon size={23} strokeWidth={active ? 2.4 : 1.9} />
              {short ?? label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileHeader() {
  return (
    <header
      className="lg:hidden flex items-center justify-between px-5 pt-5"
      style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
    >
      <Logo size={32} />
      <form action={signOut}>
        <button className="btn-ghost h-9 px-3 text-[14px]">
          <LogOut size={16} /> Sair
        </button>
      </form>
    </header>
  );
}
