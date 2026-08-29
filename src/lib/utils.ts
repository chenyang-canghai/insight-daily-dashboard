import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatBeijingDate(value: string, withTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  }).format(date);
}

export function signed(value: number | null, suffix = "%") {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}${suffix}`;
}

export function marketTone(value: number | null) {
  if (value === null || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}

export function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_]/g, "-").slice(0, 80);
}
