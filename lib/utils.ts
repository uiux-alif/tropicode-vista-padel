import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
}

const DAYS_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Format a date as a local ISO date string (YYYY-MM-DD) without timezone drift. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string into a UTC-midnight Date (stable for DB date-only columns). */
export function dateKeyToUtc(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateId(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_ID[dt.getDay()]}, ${d} ${MONTHS_ID[dt.getMonth()]} ${y}`;
}

export function formatDateEn(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_EN[dt.getDay()]}, ${d} ${MONTHS_ID[dt.getMonth()]} ${y}`;
}

export function dayLabel(key: string): { weekday: string; day: number } {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return { weekday: DAYS_EN[dt.getDay()].slice(0, 3), day: d };
}

/** Returns an array of YYYY-MM-DD keys: today + (count-1) forward. */
export function upcomingDateKeys(count: number, from = new Date()): string[] {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return toDateKey(d);
  });
}

/** Add hours to a "HH:00" time string, returning "HH:00". */
export function addHours(time: string, hours: number): string {
  const h = parseInt(time.split(":")[0], 10) + hours;
  return `${String(h).padStart(2, "0")}:00`;
}
