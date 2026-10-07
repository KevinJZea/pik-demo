import type {
  Appointment,
  Business,
  BusinessCategory,
  Service,
  Staff,
  TimeSlot,
  WeeklyHours,
} from '@/types/domain';

/**
 * Request-body contracts for the two POST endpoints (AGENTS.md §8). Defined
 * here instead of inferred from Backend's zod schemas so this client module
 * doesn't block on Backend files landing; the shapes are contract-fixed, and
 * structural typing keeps them interoperable with the schemas' inferred types.
 */
export type CreateBusinessInput = {
  name: string;
  category: BusinessCategory;
  phone: string;
  address: string;
  city: string;
  hours: WeeklyHours;
  services: Service[];
  staff: Staff[];
};

export type CreateAppointmentInput = {
  businessSlug: string;
  serviceId: string;
  /** Staff id or the literal "any" — the server resolves "any" (§10). */
  staffId: string | 'any';
  date: string;
  startMin: number;
  customerName: string;
  customerPhone: string;
};

/** Query params for GET /api/availability (§8) — all four required. */
export type AvailabilityParams = {
  business: string;
  service: string;
  /** Staff id or the literal "any". */
  staff: string;
  date: string;
};

/** Field issue from the validation envelope (§8) — zod issues, flattened. */
export type ApiIssue = { path: string; message: string };

/**
 * Fallback when a response carries no usable JSON envelope (e.g. a proxy error
 * page) or the envelope lacks a displayable message.
 */
const FALLBACK_ERROR = 'Algo salió mal. Inténtalo de nuevo en unos momentos.';

/**
 * Error thrown by every helper in this module: carries the HTTP status plus
 * the Spanish, user-displayable message parsed from the error envelope.
 */
export class PikApiError extends Error {
  readonly status: number;
  /** Present only on validation (400) responses. */
  readonly issues?: ApiIssue[];

  constructor(status: number, message: string, issues?: ApiIssue[]) {
    super(message);
    this.name = 'PikApiError';
    this.status = status;
    this.issues = issues;
  }
}

/** Shape of the JSON error envelope the Route Handlers return (§8). */
type ErrorEnvelope = { error?: unknown; issues?: unknown };

/** Demo/QA hook (§14): mirrors the server's `?fail=1` flag. */
export type FailOption = { fail?: boolean };

/** Pure builder for the availability URL — one source of param serialization. */
export function buildAvailabilityUrl(params: AvailabilityParams): string {
  const search = new URLSearchParams({
    business: params.business,
    service: params.service,
    staff: params.staff,
    date: params.date,
  });
  return `/api/availability?${search.toString()}`;
}

/**
 * Shared plumbing for the four endpoints: fetch, envelope parsing, PikApiError.
 * No retries here — the UI decides.
 */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    // Network-level failure (offline, server down): no HTTP status exists —
    // surface 0 with the generic Spanish message so the UI handles one type.
    throw new PikApiError(0, FALLBACK_ERROR);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    // Non-JSON body: keep the real status, use the fallback message.
    throw new PikApiError(response.status, FALLBACK_ERROR);
  }
  if (!response.ok) {
    const envelope = body as ErrorEnvelope;
    const message =
      typeof envelope.error === 'string' ? envelope.error : FALLBACK_ERROR;
    const issues = Array.isArray(envelope.issues)
      ? (envelope.issues as ApiIssue[])
      : undefined;
    throw new PikApiError(response.status, message, issues);
  }
  return body as T;
}

/** Appends the demo `?fail=1` flag to any API URL. */
function appendFail(url: string, fail?: boolean): string {
  return fail ? `${url}${url.includes('?') ? '&' : '?'}fail=1` : url;
}

function postJson(payload: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

/** GET /api/businesses/[slug] — the booking wizard's business fetch. */
export async function getBusinessBySlug(
  slug: string,
  opts: FailOption = {},
): Promise<Business> {
  return request<Business>(
    appendFail(`/api/businesses/${encodeURIComponent(slug)}`, opts.fail),
  );
}

/** POST /api/businesses — registration summary submit; 400 carries zod issues. */
export async function createBusiness(
  input: CreateBusinessInput,
  opts: FailOption = {},
): Promise<Business> {
  return request<Business>(
    appendFail('/api/businesses', opts.fail),
    postJson(input),
  );
}

/** GET /api/availability — slots for one service/staff/date (sorted, §10). */
export async function getAvailability(
  params: AvailabilityParams,
  opts: FailOption = {},
): Promise<TimeSlot[]> {
  return request<TimeSlot[]>(
    appendFail(buildAvailabilityUrl(params), opts.fail),
  );
}

/** POST /api/appointments — booking confirm + fake pay; 409 = slot just taken. */
export async function createAppointment(
  input: CreateAppointmentInput,
  opts: FailOption = {},
): Promise<Appointment> {
  return request<Appointment>(
    appendFail('/api/appointments', opts.fail),
    postJson(input),
  );
}
