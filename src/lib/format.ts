const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function money(value: number | string) {
  return brl.format(Number(value) || 0);
}

export function shortDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function monthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

export function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function startOfMonthISO(offset = 0) {
  const d = new Date();
  const s = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-01`;
}
