import type { DayHours, Weekday, WeeklyHours } from '@/types/domain';

const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

const TIME = new Intl.DateTimeFormat('es-MX', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

// Fixed anchor date: only its clock time is patched per call, so Intl keeps
// formatting "HH:mm" values in the same local calendar day.
const DAY_TEMPLATE = new Date(2000, 0, 1);

// es-MX short names, indexed by Weekday (0 = Sunday). Exported for compact
// date displays like the booking date strip.
export const WEEKDAY_SHORT = [
  'dom',
  'lun',
  'mar',
  'mié',
  'jue',
  'vie',
  'sáb',
] as const;

// es-MX short month names, indexed 0–11.
export const MONTH_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

/** Weekly-hours list order: Monday first, Sunday last (es-MX convention). */
export const WEEKDAYS_MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export function formatPrice(cents: number): string {
  return MXN.format(cents / 100);
}

export function formatDuration(min: number): string {
  const hours = Math.floor(min / 60);
  const rest = min % 60;
  if (hours === 0) return `${min} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

export function formatTime(minutesFromMidnight: number): string {
  const day = new Date(DAY_TEMPLATE);
  day.setHours(
    Math.floor(minutesFromMidnight / 60),
    minutesFromMidnight % 60,
    0,
    0,
  );
  return TIME.format(day);
}

export function formatTimeString(time: string): string {
  return formatTime(timeStringToMinutes(time));
}

export function timeStringToMinutes(time: string): number {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
}

export function minutesToTimeString(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  // Parse the naive "YYYY-MM-DD" string by hand: `new Date(dateStr)` would
  // parse as UTC and could shift `getDay()` across timezones. Date objects are
  // used only here to derive the weekday — the data model keeps strings.
  const [y, m, d] = dateStr.split('-').map(Number);
  const weekday = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).getDay();
  return `${WEEKDAY_SHORT[weekday]}, ${d} de ${MONTH_SHORT[(m ?? 1) - 1]}`;
}

function formatHoursRange(day: DayHours): string {
  if (day === null) return 'Cerrado';
  return `${formatTimeString(day.open)} – ${formatTimeString(day.close)}`;
}

export function formatDayHours(day: DayHours): string {
  return formatHoursRange(day);
}

/** ["Lunes: 10:00 a.m. – 7:00 p.m.", …, "Domingo: Cerrado"] */
export function formatWeeklyHours(hours: WeeklyHours): string[] {
  return WEEKDAYS_MONDAY_FIRST.map(
    (day) => `${WEEKDAY_NAMES[day]}: ${formatHoursRange(hours[day])}`,
  );
}
