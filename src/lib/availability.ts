import type {
  Appointment,
  Business,
  Service,
  TimeSlot,
  Weekday,
} from '@/types/domain';

import {
  ERROR_NOBODY_PROVIDES,
  ERROR_STAFF_NOT_PROVIDER,
  ERROR_UNKNOWN_STAFF,
  minutesFromTimeString,
  toLocalYYYYMMDD,
} from '@/lib/schemas';
import { BadRequestError, NotFoundError } from '@/lib/api-utils';

/**
 * Pure slot generation (AGENTS.md §10). No I/O: the caller supplies the
 * business's appointments (via store.listAppointments) and, for tests, the
 * clock. Shape/window validation lives in the Route Handler
 * (availabilityQuerySchema); unknown business/service need the store, so they
 * are 404s there too. The staff errors thrown here carry the §9 copy verbatim
 * and the handler maps them 1:1 to 404/400.
 */

/** §10 overlap test on half-open intervals [start, end): a.start < end && start < a.end. */
export function isOverlapping(
  startMin: number,
  endMin: number,
  appointment: Appointment,
): boolean {
  return (
    appointment.startMin < endMin &&
    startMin < appointment.startMin + appointment.durationMin
  );
}

export function generateSlots(
  business: Business,
  service: Service,
  staffParam: string,
  date: string,
  appointments: Appointment[],
  now: Date = new Date(),
): TimeSlot[] {
  const weekday = new Date(`${date}T00:00:00`).getDay() as Weekday;
  const dayHours = business.hours[weekday];
  // Closed day short-circuits BEFORE staff resolution (§10 order): even an
  // invalid staff query on a closed day is just an empty day.
  if (!dayHours) return [];

  let eligible: Business['staff'];
  if (staffParam === 'any') {
    eligible = business.staff.filter((member) =>
      member.serviceIds.includes(service.id),
    );
    if (eligible.length === 0) throw new BadRequestError(ERROR_NOBODY_PROVIDES);
  } else {
    const member = business.staff.find((item) => item.id === staffParam);
    if (!member) throw new NotFoundError(ERROR_UNKNOWN_STAFF);
    if (!member.serviceIds.includes(service.id)) {
      throw new BadRequestError(ERROR_STAFF_NOT_PROVIDER);
    }
    eligible = [member];
  }

  const openMin = minutesFromTimeString(dayHours.open);
  const closeMin = minutesFromTimeString(dayHours.close);
  // §7 invariant: TimeSlot.startMin must sit on the 15-minute grid, so when
  // opening hours start off-grid (free-form HH:mm input) the first candidate
  // rounds UP to the next grid point instead of starting mid-grid.
  const firstGridMin = openMin + ((15 - (openMin % 15)) % 15);

  const todayLocal = date === toLocalYYYYMMDD(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // Same-day slots at/before "now" are skipped entirely (§10) — not returned
  // as unavailable, because the UI would offer a bookable-looking dead slot.
  const isPast = (startMin: number): boolean =>
    todayLocal && startMin <= nowMinutes;

  // Only this business's this-day appointments can block a slot: staff ids
  // are client-generated, so the business scope keeps equal ids in different
  // businesses from colliding.
  const dayAppointments = appointments.filter(
    (appointment) =>
      appointment.businessId === business.id && appointment.date === date,
  );

  const slots: TimeSlot[] = [];
  for (
    let start = firstGridMin;
    start + service.durationMin <= closeMin;
    start += 15
  ) {
    if (isPast(start)) continue;
    // "Primero disponible": first FREE member in business.staff order (§10).
    const free = eligible.filter(
      (member) =>
        !dayAppointments.some(
          (appointment) =>
            appointment.staffId === member.id &&
            isOverlapping(start, start + service.durationMin, appointment),
        ),
    );
    slots.push({
      startMin: start,
      available: free.length > 0,
      staffId: free[0]?.id ?? null,
    });
  }
  // Candidates iterate ascending, so the result is already sorted by
  // startMin (§8 requires a sorted response; no explicit sort needed).
  return slots;
}
