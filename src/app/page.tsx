import Link from "next/link";
import {
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Fingerprint,
  Landmark,
  LockKeyhole,
  PieChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";

const features = [
  {
    icon: Landmark,
    title: "Open Finance",
    text: "Conecte seus bancos via Pluggy e importe contas, saldos e transações automaticamente.",
  },
  {
    icon: PieChart,
    title: "Dashboards vivos",
    text: "Fluxo de caixa, gastos por categoria e orçamentos com alerta antes de estourar.",
  },
  {
    icon: LockKeyhole,
    title: "Cofre zero-knowledge",
    text: "Logins e cartões cifrados com AES-256 no seu dispositivo. Nem nós conseguimos ler.",
  },
  {
    icon: ShieldCheck,
    title: "Seus dados, só seus",
    text: "Cada usuário tem sua conta e senha, isolados com Row Level Security no Supabase.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 overflow-x-hidden">
      <header className="flex items-center justify-between py-6">
        <Logo size={38} />
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">
            Entrar
          </Link>
          <Link href="/cadastro" className="btn-primary h-10 px-5 text-[14px]">
            Começar
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center pt-10 lg:pt-16 pb-20">
        <div className="animate-sheet text-center lg:text-left">
          <span className="inline-flex items-center gap-2 glass rounded-full pl-2 pr-4 py-1.5 text-[13px] text-label-2 mb-7">
            <span className="bg-brand rounded-full px-2 py-0.5 text-[11px] font-bold text-[#03140f]">NOVO</span>
            Open Finance Brasil integrado
          </span>
          <h1 className="font-display text-[46px] sm:text-[68px] leading-[1] font-extrabold tracking-[-0.045em]">
            Seu dinheiro
            <br />
            <span className="text-brand">sob controle.</span>
          </h1>
          <p className="mt-7 text-[18px] text-label-2 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Bancos, cartões e senhas reunidos em um app com a fluidez do iPhone e segurança de nível bancário.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
            <Link href="/cadastro" className="btn-primary h-13 px-8 text-[16px] group">
              Criar conta grátis <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link href="/login" className="btn-secondary h-13 px-8 text-[16px]">
              Já tenho conta
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 justify-center lg:justify-start text-[13px] text-label-3">
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-brand-1" /> AES-256-GCM</span>
            <span className="flex items-center gap-1.5"><Fingerprint size={15} className="text-brand-2" /> Senha individual</span>
            <span className="flex items-center gap-1.5"><Sparkles size={15} className="text-brand-3" /> Categorização automática</span>
          </div>
        </div>

        <PhoneMockup />
      </section>

      {/* FEATURES */}
      <section>
        <p className="section-label text-center">Tudo em um só lugar</p>
        <h2 className="font-display text-center text-[30px] sm:text-[40px] font-bold tracking-[-0.035em] mb-10">
          Feito para quem leva <span className="text-brand">finanças a sério</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card border-brand group p-6 transition hover:-translate-y-0.5">
              <div className="icon-tile w-12 h-12 rounded-2xl bg-brand mb-5">
                <Icon size={23} color="#03140f" strokeWidth={2.3} />
              </div>
              <h3 className="font-display font-semibold text-[19px] tracking-tight">{title}</h3>
              <p className="text-label-2 text-[15px] mt-1.5 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="card-hero mt-20 p-10 sm:p-14 text-center">
        <div className="flex justify-center mb-6">
          <LogoMark size={72} />
        </div>
        <h2 className="font-display text-[30px] sm:text-[42px] font-bold tracking-[-0.035em]">
          Comece em menos de um minuto.
        </h2>
        <p className="text-label-2 mt-3 text-[17px]">Grátis. Sem cartão de crédito. Teste com o Banco Demo.</p>
        <Link href="/cadastro" className="btn-primary h-13 px-8 text-[16px] mt-8">
          Criar minha conta <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-label-3">
        <Logo size={26} />
        <span>Next.js · Supabase · Open Finance Brasil</span>
      </footer>
    </main>
  );
}

function PhoneMockup() {
  const bars = [42, 58, 46, 70, 62, 88];
  return (
    <div className="relative mx-auto w-[300px] sm:w-[330px] animate-float">
      {/* brilho atrás do aparelho */}
      <div className="absolute -inset-10 bg-brand opacity-25 blur-[80px] rounded-full" aria-hidden />
      <div className="relative rounded-[54px] p-[10px] bg-gradient-to-b from-[#2a3a5c] via-[#0f1a30] to-[#1d2a46] shadow-[0_50px_100px_-30px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.25)]">
        <div className="relative rounded-[45px] overflow-hidden bg-[#030a18] aspect-[9/19.3] p-4 pt-12">
          {/* dynamic island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[96px] h-[28px] rounded-full bg-black" />
          <div className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgba(47,139,255,.35),transparent)]" />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-label-3">Bom dia,</p>
                <p className="font-display text-[15px] font-bold">Marina</p>
              </div>
              <LogoMark size={28} />
            </div>

            <div className="card-hero shine rounded-[22px] p-4">
              <p className="text-[10px] text-white/60">Saldo total</p>
              <p className="font-display text-[24px] font-bold tracking-tight tabular">R$ 41.130,35</p>
              <p className="text-[10px] text-brand-1 mt-0.5">▲ 12,4% este mês</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <div className="glass rounded-[16px] p-3">
                <span className="icon-tile w-5 h-5 rounded-full mb-1.5" style={{ background: "#12A877" }}>
                  <ArrowDownLeft size={11} color="white" />
                </span>
                <p className="text-[9px] text-label-3">Receitas</p>
                <p className="text-[12px] font-bold tabular">R$ 8.742</p>
              </div>
              <div className="glass rounded-[16px] p-3">
                <span className="icon-tile w-5 h-5 rounded-full mb-1.5" style={{ background: "#7B6CF6" }}>
                  <ArrowUpRight size={11} color="white" />
                </span>
                <p className="text-[9px] text-label-3">Despesas</p>
                <p className="text-[12px] font-bold tabular">R$ 5.318</p>
              </div>
            </div>

            <div className="glass rounded-[16px] p-3 mt-2.5">
              <p className="text-[10px] font-semibold mb-2">Fluxo de caixa</p>
              <div className="flex items-end gap-1.5 h-[60px]">
                {bars.map((h, i) => (
                  <div key={i} className="flex-1 flex items-end gap-[2px] h-full">
                    <div className="flex-1 rounded-t-[3px]" style={{ height: `${h}%`, background: "#12A877" }} />
                    <div className="flex-1 rounded-t-[3px]" style={{ height: `${h * 0.7}%`, background: "#7B6CF6" }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[16px] mt-2.5 divide-y divide-white/5">
              {[
                ["iFood", "Alimentação", "−R$ 48,90", "#FF9F0A"],
                ["Salário", "Receita", "+R$ 8.500", "#12A877"],
                ["Netflix", "Assinaturas", "−R$ 55,90", "#7D7AFF"],
              ].map(([n, c, v, col]) => (
                <div key={n} className="flex items-center gap-2 p-2.5">
                  <span className="w-6 h-6 rounded-[7px]" style={{ background: col }} />
                  <div className="flex-1">
                    <p className="text-[10px] font-medium">{n}</p>
                    <p className="text-[8px] text-label-3">{c}</p>
                  </div>
                  <p className={`text-[10px] font-semibold tabular ${v.startsWith("+") ? "text-brand-1" : ""}`}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
