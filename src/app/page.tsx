import Link from "next/link";
import { Landmark, LockKeyhole, PieChart, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

const features = [
  {
    icon: Landmark,
    color: "#0A84FF",
    title: "Open Finance",
    text: "Conecte seus bancos via Pluggy e importe contas e transações automaticamente.",
  },
  {
    icon: PieChart,
    color: "#5E5CE6",
    title: "Dashboards",
    text: "Receitas, despesas e gastos por categoria em gráficos claros, mês a mês.",
  },
  {
    icon: LockKeyhole,
    color: "#3A8DDE",
    title: "Cofre de senhas",
    text: "Logins e cartões cifrados com AES-256 no seu dispositivo. Zero-knowledge.",
  },
  {
    icon: ShieldCheck,
    color: "#30D158",
    title: "Seus dados, só seus",
    text: "Cada usuário tem sua conta e senha; Row Level Security no Supabase.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-20">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <Link href="/login" className="btn-ghost">
          Entrar
        </Link>
      </header>

      <section className="pt-14 pb-16 text-center animate-fade">
        <span className="inline-block glass rounded-full px-4 py-1.5 text-[13px] text-label-2 mb-6">
          Open Finance Brasil · Supabase · Next.js
        </span>
        <h1 className="text-[44px] sm:text-[64px] leading-[1.05] font-bold tracking-[-0.035em]">
          Seu dinheiro,
          <br />
          <span className="bg-gradient-to-r from-ios-cyan via-ios-blue to-ios-indigo bg-clip-text text-transparent">
            em uma tela só.
          </span>
        </h1>
        <p className="mt-6 text-[18px] text-label-2 max-w-xl mx-auto">
          O TabDin reúne suas contas bancárias, cartões e senhas com a simplicidade de um app de
          iPhone.
        </p>
        <div className="mt-9 flex flex-wrap gap-3 justify-center">
          <Link href="/cadastro" className="btn-primary h-12 px-7 text-[16px]">
            Criar conta grátis
          </Link>
          <Link href="/login" className="btn-secondary h-12 px-7 text-[16px]">
            Já tenho conta
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        {features.map(({ icon: Icon, color, title, text }) => (
          <div key={title} className="card flex gap-4">
            <div className="icon-tile w-11 h-11" style={{ background: color }}>
              <Icon size={22} color="white" />
            </div>
            <div>
              <h3 className="font-semibold text-[17px]">{title}</h3>
              <p className="text-label-2 text-[15px] mt-1">{text}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
