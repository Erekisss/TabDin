"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Home, Landmark, LockKeyhole, LogOut, Wallet } from "lucide-react";
import { Logo } from "./Logo";
import { signOut } from "@/app/(auth)/actions";

const items = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/open-finance", label: "Open Finance", short: "Bancos", icon: Landmark },
  { href: "/cofre", label: "Cofre", icon: LockKeyhole },
];

export function Sidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[260px] flex-col p-4 z-30">
      <div className="glass rounded-[28px] flex-1 flex flex-col p-4">
        <div className="px-2 py-3 mb-4">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-2xl px-3 h-11 text-[15px] font-medium transition ${
                  active
                    ? "bg-ios-blue text-white shadow-[0_8px_20px_-8px_rgba(10,132,255,.8)]"
                    : "text-label-2 hover:bg-surface-hover hover:text-label"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="flex items-center gap-3 rounded-2xl p-3 bg-bg-elevated/60 border border-separator">
            <div className="icon-tile w-9 h-9 rounded-full bg-gradient-to-br from-ios-blue to-ios-indigo text-white text-[14px] font-semibold">
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

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass border-x-0 border-b-0 rounded-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 h-[58px]">
        {items.map(({ href, label, short, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                active ? "text-ios-blue" : "text-label-3"
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
    <header className="lg:hidden flex items-center justify-between px-5 pt-5">
      <Logo size={30} />
      <form action={signOut}>
        <button className="btn-ghost h-9 px-3 text-[14px]">
          <LogOut size={16} /> Sair
        </button>
      </form>
    </header>
  );
}
