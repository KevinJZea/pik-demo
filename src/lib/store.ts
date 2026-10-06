import 'server-only';

import type { Appointment, Business, Weekday } from '@/types/domain';
import type { CreateAppointmentInput, CreateBusinessInput } from '@/lib/schemas';

import {
  ERROR_BAD_REQUEST,
  ERROR_NOBODY_PROVIDES,
  ERROR_SLOT_TAKEN,
  ERROR_STAFF_NOT_PROVIDER,
  ERROR_UNKNOWN_BUSINESS,
  ERROR_UNKNOWN_SERVICE,
  ERROR_UNKNOWN_STAFF,
  minutesFromTimeString,
  toLocalYYYYMMDD,
} from '@/lib/schemas';

import { BadRequestError, ConflictError, NotFoundError, simulateLatency } from '@/lib/api-utils';
import { makeReference, slugify, uniqueSlug } from '@/lib/slug';
import { seedBusinesses } from '@/mocks/businesses';
import { seedAppointments } from '@/mocks/appointments';

/**
 * In-memory store (AGENTS.md §8). Seeds load once at creation; appointments
 * are generated relative to that moment (D23) so unavailable slots always
 * demo correctly. Route handlers and RSC pages are the only callers.
 */
export type Store = {
  getBusinesses(): Promise<Business[]>;
  getBusinessBySlug(slug: string): Promise<Business | null>;
  createBusiness(input: CreateBusinessInput): Promise<Business>;
  listAppointments(businessId: string): Promise<Appointment[]>;
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>;
};

// §10 overlap test on half-open intervals [start, end): a.start < end &&
// start < a.end. Used for conflict checks here; availability.ts (B6) must
// mirror it exactly for slot generation.
function isOverlapping(startMin: number, endMin: number, appointment: Appointment): boolean {
  return (
    appointment.startMin < endMin && startMin < appointment.startMin + appointment.durationMin
  );
}

function createStore(): Store {
  const businesses = new Map<string, Business>();
  const appointments: Appointment[] = [];

  for (const business of seedBusinesses) businesses.set(business.id, business);
  appointments.push(...seedAppointments());
  // Seeds mint their own references; register them so store-generated codes
  // can never collide with a seeded one.
  const usedReferences = new Set<string>();
  for (const appointment of appointments) usedReferences.add(appointment.reference);

  return {
    async getBusinesses(): Promise<Business[]> {
      await simulateLatency(300, 600);
      return [...businesses.values()];
    },

    async getBusinessBySlug(slug: string): Promise<Business | null> {
      await simulateLatency(300, 600);
      return [...businesses.values()].find((business) => business.slug === slug) ?? null;
    },

    async createBusiness(input: CreateBusinessInput): Promise<Business> {
      await simulateLatency(300, 600);
      const takenSlugs = new Set([...businesses.values()].map((business) => business.slug));
      // A punctuation-only name slugifies to ''; fall back to a generic base
      // instead of storing an orphaned empty slug no URL can reach.
      const slug = uniqueSlug(slugify(input.name) || 'negocio', takenSlugs);
      // Input arrives zod-validated (createBusinessSchema, incl. the
      // staff.serviceIds ⊆ services invariant); the client keeps its
      // service/staff ids, the server owns id/slug/createdAt (§8).
      const business: Business = {
        id: crypto.randomUUID(),
        slug,
        name: input.name,
        category: input.category,
        phone: input.phone,
        address: input.address,
        city: input.city,
        hours: input.hours,
        services: input.services,
        staff: input.staff,
        createdAt: new Date().toISOString(),
      };
      businesses.set(business.id, business);
      return business;
    },

    async listAppointments(businessId: string): Promise<Appointment[]> {
      await simulateLatency(300, 600);
      return appointments.filter((appointment) => appointment.businessId === businessId);
    },

    async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
      await simulateLatency(300, 600);
      // Everything below runs synchronously — check → resolve → insert with no
      // awaits in between — so two concurrent confirms cannot both pass the
      // conflict check (§8: the 409 must be truthful at confirm time).

      const business = [...businesses.values()].find((item) => item.slug === input.businessSlug);
      if (!business) throw new NotFoundError(ERROR_UNKNOWN_BUSINESS);

      const service = business.services.find((item) => item.id === input.serviceId);
      if (!service) throw new NotFoundError(ERROR_UNKNOWN_SERVICE);

      // Zod already enforced shape-level rules at the handler (15-min grid,
      // 14-day window, customer fields); the store re-checks only what depends
      // on live state (§8 "never trust the client").
      let eligible: Business['staff'];
      if (input.staffId === 'any') {
        eligible = business.staff.filter((member) => member.serviceIds.includes(input.serviceId));
        if (eligible.length === 0) throw new BadRequestError(ERROR_NOBODY_PROVIDES);
      } else {
        const member = business.staff.find((item) => item.id === input.staffId);
        if (!member) throw new NotFoundError(ERROR_UNKNOWN_STAFF);
        if (!member.serviceIds.includes(input.serviceId)) {
          throw new BadRequestError(ERROR_STAFF_NOT_PROVIDER);
        }
        eligible = [member];
      }

      const weekday = new Date(`${input.date}T00:00:00`).getDay() as Weekday;
      const dayHours = business.hours[weekday];
      if (!dayHours) throw new BadRequestError(ERROR_BAD_REQUEST);

      const openMin = minutesFromTimeString(dayHours.open);
      const closeMin = minutesFromTimeString(dayHours.close);
      const endMin = input.startMin + service.durationMin;
      if (input.startMin < openMin || endMin > closeMin) {
        throw new BadRequestError(ERROR_BAD_REQUEST);
      }

      // Not in the past: same boundary as availability (§10) — start ≤ now is
      // rejected so a slot can't be booked the second it becomes "now".
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (input.date === toLocalYYYYMMDD(now) && input.startMin <= nowMinutes) {
        throw new BadRequestError(ERROR_BAD_REQUEST);
      }

      const isFree = (member: Business['staff'][number]): boolean =>
        !appointments.some(
          (appointment) =>
            appointment.businessId === business.id &&
            appointment.staffId === member.id &&
            appointment.date === input.date &&
            isOverlapping(input.startMin, endMin, appointment),
        );

      // "Primero disponible": eligible walks business.staff order, so the
      // first FREE member wins — deterministic and matches availability (§10).
      const targetStaff = eligible.find(isFree);
      if (!targetStaff) throw new ConflictError(ERROR_SLOT_TAKEN);

      const appointment: Appointment = {
        id: crypto.randomUUID(),
        reference: makeReference(usedReferences),
        businessId: business.id,
        serviceId: service.id,
        staffId: targetStaff.id,
        date: input.date,
        startMin: input.startMin,
        durationMin: service.durationMin,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        createdAt: new Date().toISOString(),
      };
      appointments.push(appointment);
      return appointment;
    },
  };
}

// Pin the store to globalThis: dev HMR re-evaluates this module on every edit
// and would otherwise wipe the demo's in-memory data mid-session (§8).
const cache = globalThis as unknown as { __pikStore?: Store };
export const store: Store = cache.__pikStore ?? (cache.__pikStore = createStore());
