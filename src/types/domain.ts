export const BUSINESS_CATEGORIES = [
  'salon',
  'barbershop',
  'spa',
  'nail-studio',
] as const;
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

/** Matches Date#getDay(): 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** "HH:mm" 24h strings, e.g. "09:30". null = closed that day. */
export type DayHours = { open: string; close: string } | null;

/** All 7 days required. */
export type WeeklyHours = Record<Weekday, DayHours>;

/** durationMin: multiple of 15, 15–240. priceCents: MXN minor units, 1–1_000_000. */
export type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
};

/** serviceIds: non-empty subset of the business's service ids. */
export type Staff = {
  id: string;
  name: string;
  role: string;
  serviceIds: string[];
};

export type Business = {
  id: string;
  slug: string;
  name: string;
  category: BusinessCategory;
  phone: string;
  address: string;
  city: string;
  hours: WeeklyHours;
  services: Service[];
  staff: Staff[];
  /** ISO 8601. */
  createdAt: string;
};

/** date: "YYYY-MM-DD" naive local. startMin: minutes from midnight, multiple of 15.
 *  staffId: always a resolved id, never "any". */
export type Appointment = {
  id: string;
  /** "PIK-XXXXXX". */
  reference: string;
  businessId: string;
  serviceId: string;
  staffId: string;
  date: string;
  startMin: number;
  durationMin: number;
  customerName: string;
  customerPhone: string;
  /** ISO 8601. */
  createdAt: string;
};

/** staffId: first eligible free staff when available; null when unavailable. */
export type TimeSlot = {
  startMin: number;
  available: boolean;
  staffId: string | null;
};
