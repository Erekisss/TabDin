"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  Briefcase,
  Car,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  PlusCircle,
  Repeat,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div>
        {subtitle && <p className="text-[13px] font-semibold uppercase tracking-wide text-label-3 mb-1">{subtitle}</p>}
        <h1 className="large-title">{title}</h1>
      </div>
      {action}
    </div>
  );
}

/** Modal estilo "sheet" do iOS: sobe de baixo no celular, centraliza no desktop. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal>
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade" onClick={onClose} aria-label="Fechar" />
      <div className="relative w-full sm:max-w-[460px] max-h-[92dvh] overflow-y-auto animate-sheet rounded-t-[28px] sm:rounded-[28px] bg-bg-elevated/95 border border-separator backdrop-blur-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="sm:hidden mx-auto -mt-2 mb-4 h-1.5 w-10 rounded-full bg-label-3/50" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-strong flex items-center justify-center text-label-2 hover:text-label" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  "plus-circle": PlusCircle,
  utensils: Utensils,
  home: Home,
  car: Car,
  "heart-pulse": HeartPulse,
  "gamepad-2": Gamepad2,
  "graduation-cap": GraduationCap,
  "shopping-bag": ShoppingBag,
  repeat: Repeat,
  tag: Tag,
};

export function CategoryIcon({ icon, color, size = 36 }: { icon?: string | null; color?: string | null; size?: number }) {
  const Icon = ICONS[icon ?? "tag"] ?? Tag;
  return (
    <div className="icon-tile" style={{ width: size, height: size, background: color ?? "#8E8E93" }}>
      <Icon size={size * 0.52} color="white" strokeWidth={2.2} />
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="card text-center py-12 flex flex-col items-center">
      <div className="icon-tile w-14 h-14 rounded-2xl bg-ios-blue/15 text-ios-blue mb-4">{icon}</div>
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <p className="text-label-2 text-[15px] mt-1 max-w-sm">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
