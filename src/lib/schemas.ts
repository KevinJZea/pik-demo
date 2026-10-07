import { z } from 'zod';

import { BUSINESS_CATEGORIES } from '@/types/domain';

/**
 * Shared validation contract (AGENTS.md §9). Messages are exact product copy —
 * never reword. minutesFromTimeString backs the open<close invariant here and
 * the Backend slot math in availability.ts (§10).
 */

export const ERROR_BAD_REQUEST = 'Revisa los datos e inténtalo de nuevo.';
export const ERROR_UNKNOWN_BUSINESS = 'Negocio no encontrado.';
export const ERROR_UNKNOWN_SERVICE = 'Servicio no encontrado.';
export const ERROR_UNKNOWN_STAFF = 'Integrante no encontrado.';
export const ERROR_STAFF_NOT_PROVIDER =
  'El integrante no ofrece este servicio.';
export const ERROR_NOBODY_PROVIDES = 'Nadie ofrece este servicio por ahora.';
export const ERROR_SLOT_TAKEN =
  'Ese horario acaba de ocuparse. Elige otro, por favor.';
export const ERROR_UNEXPECTED =
  'Algo salió mal. Inténtalo de nuevo en unos momentos.';
export const ERROR_DEMO_FAILED = 'Error simulado para demos (?fail=1).';

const MSG_NAME = 'El nombre debe tener entre 2 y 60 caracteres.';
const MSG_SERVICE_NAME =
  'El nombre del servicio debe tener entre 2 y 60 caracteres.';
const MSG_CATEGORY = 'Elige una categoría.';
const MSG_PHONE_BUSINESS = 'Ingresa un teléfono de contacto (7 a 15 dígitos).';
const MSG_PHONE_CUSTOMER = 'Ingresa tu teléfono (7 a 15 dígitos).';
const MSG_ADDRESS = 'La dirección debe tener entre 5 y 120 caracteres.';
const MSG_CITY = 'La ciudad debe tener entre 2 y 60 caracteres.';
const MSG_HOURS_MIN_OPEN = 'El negocio debe abrir al menos un día.';
const MSG_HOURS_TIME_FORMAT = 'Usa el formato HH:mm (por ejemplo, 09:30).';
const MSG_HOURS_ORDER =
  'La hora de cierre debe ser posterior a la de apertura.';
const MSG_DURATION =
  'La duración debe estar entre 15 y 240 minutos, en múltiplos de 15.';
const MSG_PRICE = 'El precio debe ser mayor a $0 y menor a $10,000 MXN.';
const MSG_MIN_SERVICES = 'Agrega al menos un servicio antes de continuar.';
const MSG_STAFF_ROLE = 'El rol debe tener entre 2 y 40 caracteres.';
const MSG_STAFF_SERVICES = 'Asigna al menos un servicio a cada integrante.';
const MSG_MIN_STAFF = 'Agrega al menos un integrante antes de continuar.';
const MSG_BOOKING_DATE = 'Elige una fecha dentro de los próximos 14 días.';
const MSG_START_MIN = 'Elige un horario válido.';

const WEEKDAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const;

export const businessNameSchema = z
  .string({ message: MSG_NAME })
  .trim()
  .min(2, MSG_NAME)
  .max(60, MSG_NAME);

export const staffNameSchema = businessNameSchema;
export const customerNameSchema = businessNameSchema;

export const serviceNameSchema = z
  .string({ message: MSG_SERVICE_NAME })
  .trim()
  .min(2, MSG_SERVICE_NAME)
  .max(60, MSG_SERVICE_NAME);

// One Spanish message per context (§9) on every failure tier — non-string,
// illegal characters, wrong digit count — so no zod default English can ever
// surface for a phone field. Business and customer phones share the rules;
// only the copy differs.
function phoneSchema(message: string) {
  return z
    .string({ message })
    .trim()
    .regex(/^[+\d][+\d\s-]*$/, message)
    .refine((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }, message);
}

export const businessPhoneSchema = phoneSchema(MSG_PHONE_BUSINESS);
export const customerPhoneSchema = phoneSchema(MSG_PHONE_CUSTOMER);

export const addressSchema = z
  .string({ message: MSG_ADDRESS })
  .trim()
  .min(5, MSG_ADDRESS)
  .max(120, MSG_ADDRESS);

export const citySchema = z
  .string({ message: MSG_CITY })
  .trim()
  .min(2, MSG_CITY)
  .max(60, MSG_CITY);

export const categorySchema = z.enum(BUSINESS_CATEGORIES, {
  message: MSG_CATEGORY,
});

export function minutesFromTimeString(value: string): number {
  const split = value.split(':');
  return Number(split[0]) * 60 + Number(split[1]);
}

const timeOfDaySchema = z
  .string({ message: MSG_HOURS_TIME_FORMAT })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, MSG_HOURS_TIME_FORMAT);

export const dayHoursSchema = z
  .object({ open: timeOfDaySchema, close: timeOfDaySchema })
  .refine(
    (hours) =>
      minutesFromTimeString(hours.open) < minutesFromTimeString(hours.close),
    MSG_HOURS_ORDER,
  );

export const weeklyHoursSchema: z.ZodType<
  Record<0 | 1 | 2 | 3 | 4 | 5 | 6, { open: string; close: string } | null>
> = z
  .record(z.enum(WEEKDAY_KEYS), z.nullable(dayHoursSchema))
  .refine(
    (hours) => Object.values(hours).some((day) => day !== null),
    MSG_HOURS_MIN_OPEN,
  );

export const durationMinSchema = z
  .number({ message: MSG_DURATION })
  .int(MSG_DURATION)
  .min(15, MSG_DURATION)
  .max(240, MSG_DURATION)
  .multipleOf(15, MSG_DURATION);

export const priceCentsSchema = z
  .number({ message: MSG_PRICE })
  .int(MSG_PRICE)
  .min(1, MSG_PRICE)
  .max(1_000_000, MSG_PRICE);

export const roleSchema = z
  .string({ message: MSG_STAFF_ROLE })
  .trim()
  .min(2, MSG_STAFF_ROLE)
  .max(40, MSG_STAFF_ROLE);

export const serviceIdListSchema = z
  .array(z.string({ message: MSG_STAFF_SERVICES }).min(1, MSG_STAFF_SERVICES), {
    message: MSG_STAFF_SERVICES,
  })
  .min(1, MSG_STAFF_SERVICES);

export const serviceSchema = z.object({
  id: z.string({ message: ERROR_BAD_REQUEST }).min(1, ERROR_BAD_REQUEST),
  name: serviceNameSchema,
  durationMin: durationMinSchema,
  priceCents: priceCentsSchema,
});

export const staffInputSchema = z.object({
  id: z.string({ message: ERROR_BAD_REQUEST }).min(1, ERROR_BAD_REQUEST),
  name: staffNameSchema,
  role: roleSchema,
  serviceIds: serviceIdListSchema,
});

export const createBusinessSchema = z
  .object({
    name: businessNameSchema,
    category: categorySchema,
    phone: businessPhoneSchema,
    address: addressSchema,
    city: citySchema,
    hours: weeklyHoursSchema,
    services: z
      .array(serviceSchema, { message: MSG_MIN_SERVICES })
      .min(1, MSG_MIN_SERVICES),
    staff: z
      .array(staffInputSchema, { message: MSG_MIN_STAFF })
      .min(1, MSG_MIN_STAFF),
  })
  .superRefine((body, ctx) => {
    const serviceIds = new Set(body.services.map((service) => service.id));
    const seenServiceIds = new Set<string>();
    body.services.forEach((service, index) => {
      if (seenServiceIds.has(service.id)) {
        ctx.addIssue({
          code: 'custom',
          message: ERROR_BAD_REQUEST,
          path: ['services', index, 'id'],
        });
      }
      seenServiceIds.add(service.id);
    });

    const seenStaffIds = new Set<string>();
    body.staff.forEach((member, index) => {
      if (seenStaffIds.has(member.id)) {
        ctx.addIssue({
          code: 'custom',
          message: ERROR_BAD_REQUEST,
          path: ['staff', index, 'id'],
        });
      }
      seenStaffIds.add(member.id);
      const unknownService = member.serviceIds.some(
        (serviceId) => !serviceIds.has(serviceId),
      );
      if (member.serviceIds.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: MSG_STAFF_SERVICES,
          path: ['staff', index, 'serviceIds'],
        });
      }
      if (unknownService) {
        ctx.addIssue({
          code: 'custom',
          message: ERROR_BAD_REQUEST,
          path: ['staff', index, 'serviceIds'],
        });
      }
    });
  });

// Dates are naive local strings (§5); validating via a Date round-trip is the
// one sanctioned escape from "no Date objects" for rejecting impossible
// calendar days like 2026-02-30 without pulling in date-fns (D8).
export function toLocalYYYYMMDD(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidNaiveDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && toLocalYYYYMMDD(date) === value;
}

function isWithinBookingWindow(value: string): boolean {
  const now = new Date();
  const today = toLocalYYYYMMDD(now);
  const windowEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 13,
  );
  return value >= today && value <= toLocalYYYYMMDD(windowEnd);
}

export const bookingDateSchema = z
  .string({ message: MSG_BOOKING_DATE })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, MSG_BOOKING_DATE)
  .refine(isValidNaiveDate, MSG_BOOKING_DATE)
  .refine(isWithinBookingWindow, MSG_BOOKING_DATE);

export const startMinSchema = z
  .number({ message: MSG_START_MIN })
  .int(MSG_START_MIN)
  .min(0, MSG_START_MIN)
  .multipleOf(15, MSG_START_MIN);

export const createAppointmentSchema = z.object({
  businessSlug: z
    .string({ message: ERROR_BAD_REQUEST })
    .trim()
    .min(1, ERROR_BAD_REQUEST),
  serviceId: z.string({ message: ERROR_BAD_REQUEST }).min(1, ERROR_BAD_REQUEST),
  staffId: z.string({ message: ERROR_BAD_REQUEST }).min(1, ERROR_BAD_REQUEST),
  date: bookingDateSchema,
  startMin: startMinSchema,
  customerName: customerNameSchema,
  customerPhone: customerPhoneSchema,
});

export const availabilityQuerySchema = z.object({
  business: z.string({ message: ERROR_BAD_REQUEST }).min(1, ERROR_BAD_REQUEST),
  service: z.string({ message: ERROR_BAD_REQUEST }).min(1, ERROR_BAD_REQUEST),
  staff: z.string({ message: ERROR_BAD_REQUEST }).min(1, ERROR_BAD_REQUEST),
  date: bookingDateSchema,
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export type ApiIssue = { path: string; message: string };

export function zodIssues(error: z.ZodError): ApiIssue[] {
  // One field can trip two rules carrying the same copy (e.g. a phone string
  // fails both the character and the digit-count rule) — dedupe identical
  // path+message pairs so UI banners never repeat a line.
  const seen = new Set<string>();
  const issues: ApiIssue[] = [];
  for (const issue of error.issues) {
    const item: ApiIssue = {
      path: issue.path.join('.'),
      message: issue.message,
    };
    const key = `${item.path}\n${item.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    issues.push(item);
  }
  return issues;
}
