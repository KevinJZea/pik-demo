import { BUSINESS_CATEGORIES } from '@/types/domain';
import type {
  BusinessCategory,
  Service,
  Staff,
  WeeklyHours,
} from '@/types/domain';
import {
  addressSchema,
  businessNameSchema,
  businessPhoneSchema,
  citySchema,
  weeklyHoursSchema,
} from '@/lib/schemas';

/**
 * Pure state for the registration wizard (AGENTS.md §13, D11). The draft
 * mirrors CreateBusinessInput, but step-1/2 fields stay partially filled while
 * the owner works through the steps; the step-completion predicates decide
 * when guards let navigation through. No React here — wizard-provider.tsx owns
 * the React wiring, persistence included.
 */

export type WizardDraft = {
  name: string;
  /** null until the owner picks one of the four categories. */
  category: BusinessCategory | null;
  phone: string;
  address: string;
  city: string;
  /** open/close "HH:mm" for open days; null = closed. Always 7 entries. */
  hours: WeeklyHours;
  services: Service[];
  staff: Staff[];
};

/** URL of each wizard step, indexed to match the step predicates (§13). */
export const STEP_ROUTES = [
  '/register',
  '/register/location',
  '/register/services',
  '/register/staff',
  '/register/summary',
] as const;

export function emptyWeeklyHours(): WeeklyHours {
  return { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
}

export function emptyDraft(): WizardDraft {
  return {
    name: '',
    category: null,
    phone: '',
    address: '',
    city: '',
    hours: emptyWeeklyHours(),
    services: [],
    staff: [],
  };
}

type DetailsPatch = Partial<Pick<WizardDraft, 'name' | 'category' | 'phone'>>;
type LocationPatch = Partial<Pick<WizardDraft, 'address' | 'city'>>;
type ServicePatch = Partial<Omit<Service, 'id'>>;
type StaffPatch = Partial<Omit<Staff, 'id'>>;

export type WizardAction =
  /** Restore a draft read from sessionStorage on mount. */
  | { type: 'hydrate'; draft: WizardDraft }
  | { type: 'setDetails'; patch: DetailsPatch }
  | { type: 'setLocation'; patch: LocationPatch }
  | { type: 'setHours'; hours: WeeklyHours }
  | { type: 'addService'; service: Service }
  | { type: 'updateService'; id: string; patch: ServicePatch }
  | { type: 'deleteService'; id: string }
  | { type: 'addStaff'; member: Staff }
  | { type: 'updateStaff'; id: string; patch: StaffPatch }
  | { type: 'deleteStaff'; id: string }
  /** Back to a blank draft — the provider also clears the persisted copy. */
  | { type: 'reset' };

export function wizardReducer(
  state: WizardDraft,
  action: WizardAction,
): WizardDraft {
  switch (action.type) {
    case 'hydrate':
      return action.draft;
    case 'setDetails':
      return { ...state, ...action.patch };
    case 'setLocation':
      return { ...state, ...action.patch };
    case 'setHours':
      return { ...state, hours: action.hours };
    case 'addService':
      return { ...state, services: [...state.services, action.service] };
    case 'updateService':
      // Service ids are immutable: staff.serviceIds reference them, and the
      // createBusiness schema keeps the owner-provided ids as-is (§8).
      return {
        ...state,
        services: state.services.map((service) =>
          service.id === action.id ? { ...service, ...action.patch } : service,
        ),
      };
    case 'deleteService': {
      // D24 cascade: a deleted service's id must vanish from every staff
      // member's serviceIds, or the payload would carry orphaned references.
      // Members left with zero services are re-validated at the staff step.
      return {
        ...state,
        services: state.services.filter((service) => service.id !== action.id),
        staff: state.staff.map((member) =>
          member.serviceIds.includes(action.id)
            ? {
                ...member,
                serviceIds: member.serviceIds.filter(
                  (serviceId) => serviceId !== action.id,
                ),
              }
            : member,
        ),
      };
    }
    case 'addStaff':
      return { ...state, staff: [...state.staff, action.member] };
    case 'updateStaff':
      return {
        ...state,
        staff: state.staff.map((member) =>
          member.id === action.id ? { ...member, ...action.patch } : member,
        ),
      };
    case 'deleteStaff':
      return {
        ...state,
        staff: state.staff.filter((member) => member.id !== action.id),
      };
    case 'reset':
      return emptyDraft();
  }
}

export function isDetailsComplete(draft: WizardDraft): boolean {
  return (
    businessNameSchema.safeParse(draft.name).success &&
    draft.category !== null &&
    businessPhoneSchema.safeParse(draft.phone).success
  );
}

export function isLocationComplete(draft: WizardDraft): boolean {
  return (
    addressSchema.safeParse(draft.address).success &&
    citySchema.safeParse(draft.city).success &&
    weeklyHoursSchema.safeParse(draft.hours).success
  );
}

export function isServicesComplete(draft: WizardDraft): boolean {
  // Editors only commit schema-valid services, so the count is the gate.
  return draft.services.length >= 1;
}

export function isStaffComplete(draft: WizardDraft): boolean {
  if (draft.staff.length === 0) return false;
  const serviceIds = new Set(draft.services.map((service) => service.id));
  return draft.staff.every(
    (member) =>
      // ≥1 block also trips right after a cascade delete stripped someone's
      // last service (D24); the subset check catches stale restored drafts.
      member.serviceIds.length >= 1 &&
      member.serviceIds.every((serviceId) => serviceIds.has(serviceId)),
  );
}

/**
 * Completeness of steps 0–3. Step 4 (summary) is decided by the
 * createBusinessSchema parse at submit time, not by a predicate.
 */
export function isStepComplete(draft: WizardDraft, step: number): boolean {
  switch (step) {
    case 0:
      return isDetailsComplete(draft);
    case 1:
      return isLocationComplete(draft);
    case 2:
      return isServicesComplete(draft);
    case 3:
      return isStaffComplete(draft);
    default:
      return false;
  }
}

/**
 * Route of the first incomplete prerequisite step, or null when the page can
 * stay. Each step only checks steps BEFORE it (§13 step guards); its own
 * completeness gates its "Continuar", not its render.
 */
export function guardTargetForStep(
  draft: WizardDraft,
  step: number,
): string | null {
  for (let index = 0; index < step; index += 1) {
    if (!isStepComplete(draft, index)) return STEP_ROUTES[index];
  }
  return null;
}

export const DRAFT_KEY = 'pik-registration-draft';

export function loadDraft(): WizardDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    // Garbage (hand-edited or stale-shape storage) is dropped, never thrown
    // into the wizard — a broken draft must behave like no draft at all.
    return isWizardDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: WizardDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage can be full or blocked (private mode): persistence silently
    // degrades; the in-memory wizard keeps working.
  }
}

function isWeeklyHoursShape(value: unknown): value is WeeklyHours {
  if (typeof value !== 'object' || value === null) return false;
  const values = Object.values(value as Record<string, unknown>);
  if (values.length !== 7) return false;
  return values.every((day) => {
    if (day === null) return true;
    if (typeof day !== 'object' || day === null) return false;
    const dayHours = day as Record<string, unknown>;
    return (
      typeof dayHours.open === 'string' && typeof dayHours.close === 'string'
    );
  });
}

function isServiceLike(value: unknown): value is Service {
  if (typeof value !== 'object' || value === null) return false;
  const service = value as Record<string, unknown>;
  return (
    typeof service.id === 'string' &&
    service.id !== '' &&
    typeof service.name === 'string' &&
    typeof service.durationMin === 'number' &&
    Number.isFinite(service.durationMin) &&
    typeof service.priceCents === 'number' &&
    Number.isFinite(service.priceCents)
  );
}

function isStaffLike(value: unknown): value is Staff {
  if (typeof value !== 'object' || value === null) return false;
  const member = value as Record<string, unknown>;
  return (
    typeof member.id === 'string' &&
    member.id !== '' &&
    typeof member.name === 'string' &&
    typeof member.role === 'string' &&
    Array.isArray(member.serviceIds) &&
    member.serviceIds.every((serviceId) => typeof serviceId === 'string')
  );
}

function isWizardDraft(value: unknown): value is WizardDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Record<string, unknown>;
  return (
    typeof draft.name === 'string' &&
    (draft.category === null ||
      (typeof draft.category === 'string' &&
        (BUSINESS_CATEGORIES as readonly string[]).includes(draft.category))) &&
    typeof draft.phone === 'string' &&
    typeof draft.address === 'string' &&
    typeof draft.city === 'string' &&
    isWeeklyHoursShape(draft.hours) &&
    Array.isArray(draft.services) &&
    draft.services.every(isServiceLike) &&
    Array.isArray(draft.staff) &&
    draft.staff.every(isStaffLike)
  );
}
