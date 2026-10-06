import type { Appointment, Weekday } from '@/types/domain';

import { minutesFromTimeString, toLocalYYYYMMDD } from '@/lib/schemas';

import { seedBusinesses } from './businesses';

/**
 * Seeded appointments (AGENTS.md §12, D23): 4–8 per business spread across
 * today/+1/+2, all valid per the §10 slot rules, with dates computed relative
 * to the moment this runs (store creation) so the unavailable-slot demo never
 * goes stale.
 *
 * A fixed "today/+1/+2" targeting cannot hold the 4–8 count for every possible
 * weekday — Don Rafa closes Mondays and Luna closes Mon+Tue, so on those days
 * some window days vanish. Each business therefore defines ONE per-open-day
 * pattern whose times are relative to that day's opening hour (valid on every
 * open day), replayed on each open day inside the window, design-major
 * interleaved across days and capped at 8.
 */

type SlotDesign = {
  serviceId: string;
  staffId: string;
  /**
   * Minutes after the day's opening time. Chosen so startRelMin +
   * durationMin fits the business's SHORTEST open day (Don Rafa's Sunday
   * 10:00–14:00 = 240 min, Aura's Monday 11:00–17:00 = 360 min) — that makes
   * the fit-before-close rule (§10) hold regardless of which weekday "today" is.
   */
  startRelMin: number;
};

const DESIGN_BY_BUSINESS_ID: Record<string, SlotDesign[]> = {
  'biz-barberia-don-rafa': [
    // Same-time pair on different staff — demos that availability is per-staff.
    { serviceId: 'svc-rafa-corte-barba', staffId: 'staff-rafa-julian', startRelMin: 30 },
    { serviceId: 'svc-rafa-corte-clasico', staffId: 'staff-rafa-mateo', startRelMin: 30 },
    { serviceId: 'svc-rafa-afeitado', staffId: 'staff-rafa-rafa', startRelMin: 150 },
    { serviceId: 'svc-rafa-arreglo-barba', staffId: 'staff-rafa-mateo', startRelMin: 225 },
  ],
  'biz-salon-aura': [
    { serviceId: 'svc-aura-corte-peinado', staffId: 'staff-aura-sofia', startRelMin: 60 },
    { serviceId: 'svc-aura-lavado-peinado', staffId: 'staff-aura-mariana', startRelMin: 60 },
    { serviceId: 'svc-aura-tinte', staffId: 'staff-aura-valeria', startRelMin: 240 },
  ],
  'biz-spa-sereno': [
    { serviceId: 'svc-sereno-masaje-relajante', staffId: 'staff-sereno-leon', startRelMin: 120 },
    { serviceId: 'svc-sereno-facial', staffId: 'staff-sereno-fernanda', startRelMin: 120 },
    { serviceId: 'svc-sereno-masaje-descontracturante', staffId: 'staff-sereno-diana', startRelMin: 390 },
  ],
  'biz-estudio-unas-luna': [
    { serviceId: 'svc-luna-manicure-tradicional', staffId: 'staff-luna-camila', startRelMin: 45 },
    { serviceId: 'svc-luna-manicure-gel', staffId: 'staff-luna-renata', startRelMin: 45 },
    { serviceId: 'svc-luna-pedicure-spa', staffId: 'staff-luna-luna', startRelMin: 210 },
    { serviceId: 'svc-luna-unas-acrilicas', staffId: 'staff-luna-renata', startRelMin: 330 },
  ],
};

// §10 alphabet: no ambiguous chars (no 0/O, 1/I/L). Mirrors the format the
// store's generator must produce; seeds only need batch-unique codes.
const REFERENCE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function makeSeedReference(used: Set<string>): string {
  let reference = '';
  do {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const chars = Array.from(bytes, (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]);
    reference = `PIK-${chars.join('')}`;
  } while (used.has(reference));
  used.add(reference);
  return reference;
}

// Index-aligned fake Spanish customers for the seeds.
const SEED_CUSTOMERS = [
  { name: 'Mariana López', phone: '55 8000 1102' },
  { name: 'Diego Herrera', phone: '55 8000 2203' },
  { name: 'Ana Beltrán', phone: '55 8000 3304' },
  { name: 'Luis Fuentes', phone: '55 8000 4405' },
  { name: 'Paola Márquez', phone: '55 8000 5506' },
  { name: 'Andrés Silva', phone: '55 8000 6607' },
  { name: 'Regina Cortés', phone: '55 8000 7708' },
  { name: 'Tomás Guzmán', phone: '55 8000 8809' },
  { name: 'Fernanda Ruiz', phone: '55 8000 9910' },
  { name: 'Emilio Navarro', phone: '55 8000 1121' },
  { name: 'Julia Pineda', phone: '55 8000 2232' },
  { name: 'Hugo Salas', phone: '55 8000 3343' },
];

function addDaysToNaive(dateStr: string, offset: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Local-calendar math (D32): no UTC round-trips, no timezone math.
  return toLocalYYYYMMDD(new Date(year, month - 1, day + offset));
}

export function seedAppointments(now: Date = new Date()): Appointment[] {
  const today = toLocalYYYYMMDD(now);
  const todayWeekday = new Date(`${today}T00:00:00`).getDay();
  const usedReferences = new Set<string>();
  const appointments: Appointment[] = [];

  for (const business of seedBusinesses) {
    const designs = DESIGN_BY_BUSINESS_ID[business.id];
    // Fail-fast on seed-authoring mistakes: an unknown business id or empty
    // pattern would silently starve that business's demo data.
    if (!designs || designs.length === 0) {
      throw new Error(`Seed design missing for business ${business.id}`);
    }

    // Open days inside today..+2. Closed window days simply skip their slots.
    const openOffsets = [0, 1, 2].filter(
      (offset) => business.hours[((todayWeekday + offset) % 7) as Weekday] !== null,
    );
    if (openOffsets.length === 0) continue; // defensive: unreachable with these seeds

    // Design-major interleave (each design walks the open days in order) so
    // the slice cap drops whole late designs instead of emptying one day.
    const ordered: Array<{ design: SlotDesign; offset: number }> = [];
    for (const design of designs) {
      for (const offset of openOffsets) {
        ordered.push({ design, offset });
      }
    }

    for (const { design, offset } of ordered.slice(0, 8)) {
      // Invariant checks throw at boot: a broken seed is a broken demo, so
      // fail loudly instead of shipping invalid data (no test suite exists —
      // §2). Covers typos in service/staff ids and privilege drift (staff not
      // providing the service).
      const service = business.services.find((item) => item.id === design.serviceId);
      const staff = business.staff.find((item) => item.id === design.staffId);
      if (!service || !staff || !staff.serviceIds.includes(design.serviceId)) {
        throw new Error(`Invalid seed design for ${business.id}: ${design.serviceId}/${design.staffId}`);
      }

      const date = addDaysToNaive(today, offset);
      const weekday = new Date(`${date}T00:00:00`).getDay() as Weekday;
      const dayHours = business.hours[weekday];
      if (!dayHours) {
        throw new Error(`Seed lands on closed day for ${business.id} (${date})`);
      }
      const openMin = minutesFromTimeString(dayHours.open);
      const startMin = openMin + design.startRelMin;
      const endMin = startMin + service.durationMin;
      if (startMin % 15 !== 0 || startMin < openMin || endMin > minutesFromTimeString(dayHours.close)) {
        throw new Error(`Seed slot out of hours for ${business.id} (${date} @ ${startMin})`);
      }

      // §10 overlap test (half-open interval): a.start < end && start < a.end,
      // scoped to same business/staff/date. Guards future pattern edits from
      // double-booking a staff member.
      const overlaps = appointments.some(
        (appointment) =>
          appointment.businessId === business.id &&
          appointment.staffId === design.staffId &&
          appointment.date === date &&
          appointment.startMin < endMin &&
          startMin < appointment.startMin + appointment.durationMin,
      );
      if (overlaps) {
        throw new Error(`Seed double-books ${design.staffId} on ${date} @ ${startMin}`);
      }

      const customer = SEED_CUSTOMERS[appointments.length % SEED_CUSTOMERS.length];
      appointments.push({
        id: crypto.randomUUID(),
        reference: makeSeedReference(usedReferences),
        businessId: business.id,
        serviceId: service.id,
        staffId: staff.id,
        date,
        startMin,
        durationMin: service.durationMin,
        customerName: customer.name,
        customerPhone: customer.phone,
        createdAt: now.toISOString(),
      });
    }
  }

  return appointments;
}
