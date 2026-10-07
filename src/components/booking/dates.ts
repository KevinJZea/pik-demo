import type { Weekday, WeeklyHours } from '@/types/domain';

/**
 * Naive local "YYYY-MM-DD" helpers for the booking window (§10: today…today+13).
 * Dates stay strings end-to-end; Date objects are only used for the arithmetic.
 */

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function todayLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** addDays("2026-10-06", 1) → "2026-10-07" (handles month/year rollover). */
export function addDays(dateStr: string, days: number): string {
  // Hand-parse: `new Date("YYYY-MM-DD")` parses as UTC midnight and can shift
  // the calendar day across timezones.
  const [y, m, d] = dateStr.split('-').map(Number);
  const base = new Date(y ?? 0, (m ?? 1) - 1, (d ?? 1) + days);
  return `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
}

/** The 14 selectable days: today…today+13, matching the API window. */
export function bookingWindow(): string[] {
  const today = todayLocal();
  return Array.from({ length: 14 }, (_, i) => addDays(today, i));
}

export function dayOfWeek(dateStr: string): Weekday {
  // Hand-parse for the same UTC-shift reason as addDays.
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).getDay() as Weekday;
}

export function isClosedOn(hours: WeeklyHours, dateStr: string): boolean {
  return hours[dayOfWeek(dateStr)] === null;
}
