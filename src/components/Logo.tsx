"use client";

import { useId } from "react";

/**
 * Logo TabDin — monograma "TD": o T e o D compartilham a mesma haste,
 * e as barras de crescimento dentro do D representam o dinheiro evoluindo.
 * Cada instância tem ids de gradiente próprios: se uma cópia estiver oculta (display:none),
 * as outras continuam renderizando os gradientes.
 */
export function LogoMark({ size = 40, flat = false }: { size?: number; flat?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (name: string) => `${name}-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id={id("td-bg")} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0E2452" />
          <stop offset=".55" stopColor="#071433" />
          <stop offset="1" stopColor="#02060F" />
        </linearGradient>
        <radialGradient id={id("td-glow")} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(78 30) rotate(120) scale(80)">
          <stop offset="0" stopColor="#22E39B" stopOpacity=".35" />
          <stop offset="1" stopColor="#22E39B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("td-ink")} x1="24" y1="30" x2="100" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3CF5B0" />
          <stop offset=".5" stopColor="#19C6FF" />
          <stop offset="1" stopColor="#4B6BFF" />
        </linearGradient>
        <linearGradient id={id("td-edge")} x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset="1" stopColor="#fff" stopOpacity=".03" />
        </linearGradient>
      </defs>
      {!flat && (
        <>
          <rect width="120" height="120" rx="30" fill={`url(#${id("td-bg")})`} />
          <rect width="120" height="120" rx="30" fill={`url(#${id("td-glow")})`} />
          <rect x=".75" y=".75" width="118.5" height="118.5" rx="29.25" stroke={`url(#${id("td-edge")})`} strokeWidth="1.5" />
        </>
      )}
      <path d="M26 33H68A27 27 0 0 1 68 87H54V33" stroke={`url(#${id("td-ink")})`} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="63" y="62" width="7" height="14" rx="3.5" fill="#fff" />
      <rect x="74" y="50" width="7" height="26" rx="3.5" fill="#fff" />
    </svg>
  );
}

export function Logo({ size = 36, tagline = false }: { size?: number; tagline?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="leading-none">
        <span className="font-display font-bold tracking-[-0.03em]" style={{ fontSize: size * 0.56 }}>
          Tab<span className="text-brand">Din</span>
        </span>
        {tagline && (
          <span className="block text-[10px] tracking-[0.22em] uppercase text-label-3 mt-1">Finanças · Open Finance</span>
        )}
      </div>
    </div>
  );
}
