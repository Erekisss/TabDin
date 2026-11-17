"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";

export interface CashflowPoint {
  month: string;
  receitas: number;
  despesas: number;
}

// Paleta validada (scripts/validate_palette.js, modo escuro): CVD ΔE 27 · contraste ≥ 3:1
const INCOME = "#1F7FE0";
const EXPENSE = "#C86A12";

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  return (
    <div>
      <div className="flex gap-4 text-[13px] text-label-2 mb-3" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: INCOME }} /> Receitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: EXPENSE }} /> Despesas
        </span>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ left: -12, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} stroke="rgba(120,150,220,0.12)" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "rgba(200,215,255,.6)", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fill: "rgba(170,190,240,.45)", fontSize: 11 }}
              tickFormatter={(v: number) => compact.format(v)}
            />
            <Tooltip
              cursor={{ fill: "rgba(120,150,220,0.08)" }}
              formatter={(v) => money(Number(v))}
              contentStyle={{
                background: "rgba(10,20,40,.92)",
                border: "1px solid rgba(120,150,220,.2)",
                borderRadius: 14,
                backdropFilter: "blur(20px)",
                color: "#f2f5ff",
                fontSize: 13,
              }}
              labelStyle={{ color: "rgba(200,215,255,.7)", textTransform: "capitalize" }}
            />
            <Bar dataKey="receitas" name="Receitas" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="despesas" name="Despesas" fill={EXPENSE} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Tabela acessível para leitores de tela */}
      <table className="sr-only">
        <caption>Fluxo de caixa mensal</caption>
        <thead>
          <tr><th>Mês</th><th>Receitas</th><th>Despesas</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}><td>{d.month}</td><td>{money(d.receitas)}</td><td>{money(d.despesas)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
