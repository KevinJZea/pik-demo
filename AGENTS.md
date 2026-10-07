# AGENTS.md — PIK MVP: Single Source of Truth

This file is the contract for every agent (human or AI) working on this repository.
Read it completely before writing any code. If any code, README, or future
DECISIONS.md disagrees with this file, **this file wins**. Never diverge silently:
propose the change to the project owner instead.

- **Why it exists:** one Backend agent and one Frontend agent work **simultaneously**
  on this MVP. This file is what keeps them compatible without talking to each other.
- **Rationale register:** the *why* and rejected alternatives for every decision live
  in DECISIONS.md (written later). This file only states the *what* and the *how*.

---

## 1. Project overview

PIK is a booking-and-payment marketplace for beauty & wellness businesses (salons,
barbershops, spas, nail studios). This repository is the **MVP demo**, already deployed
on Vercel. It contains exactly two user flows plus a home page:

1. **Business registration** (`/register/*`) — a 5-step wizard in which an owner
   enters: business details, location & weekly hours, services, staff (+ which services
   each staff member provides), and a summary that confirms creation.
2. **Appointment booking** (`/b/[slug]`) — a customer opens a business profile, picks a
   service, a staff member ("Primero disponible" allowed), a date & time slot (unavailable
   slots are visible but not selectable), confirms, and "pays" (simulated).
3. **Home** (`/`) — a directory of businesses that links to both flows.

### Current repository state

Fresh Next.js 16.3.8 skeleton: root `src/app/layout.tsx` (already `lang="es"`), a
placeholder `src/app/page.tsx`, and `globals.css` with only `@import 'tailwindcss'`.
Dependencies `zod@4.6.5` and `server-only@0.0.1` are already installed. Nothing else is
implemented. Both agents start from this state.

---

## 2. Hard constraints (do not violate)

- **No database, no authentication, no real payments, no external services.**
- All data is mocked: seed data lives in `src/mocks/`, is loaded into an in-memory
  store, and is read either directly by server components or through Route Handlers.
- Testing is out of scope. Verify with `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- Mobile-first, fully responsive.
- **Product copy (every user-visible string) is Spanish.** Code, identifiers, and docs
  are English. Prices are **MXN**, stored as integer **cents**.
- No new dependencies beyond the approved set — `zod` and `server-only` (runtime),
  `@stylistic/eslint-plugin` (dev, lint-only) — without owner approval.
- Do not commit unless the owner explicitly asks.

---

## 3. Team & ownership

Two agents work at the same time. **Never edit a file you don't own.** If you need a
change in the other agent's territory (including contract files), ask the owner to
relay it.

| Path | Owner | Notes |
|---|---|---|
| `src/types/domain.ts` | **Shared contract** | See §7 for the startup rule and the verbatim content. Backend maintains it afterwards. |
| `src/lib/schemas.ts` | Backend | Frontend *imports* it (read-only) for client-side form validation. |
| `src/lib/store.ts`, `src/lib/availability.ts`, `src/lib/slug.ts`, `src/lib/api-utils.ts` | Backend | `store.ts` and `api-utils.ts` are server-only. |
| `src/mocks/*` | Backend | Seed data. Only the store imports it. |
| `src/app/api/**` | Backend | The four Route Handlers. |
| `src/lib/api.ts`, `src/lib/format.ts`, `src/lib/categories.ts` | Frontend | Client helpers, formatting, category UI config. |
| `src/components/**` | Frontend | `ui/` primitives + `home/`, `register/`, `booking/`. |
| `src/app/**` (everything that is **not** `api/`) | Frontend | All pages, layouts, `loading.tsx`, `error.tsx`, `not-found.tsx`, `globals.css`, root layout. |

### Startup protocol (race-proof)

`src/types/domain.ts` is needed by both agents immediately, so it has a special rule:
**whichever agent starts first creates it as a verbatim copy of the code block in §7**
(no changes, no additions). Because the content is fixed, identical copies cannot
conflict. The second agent verifies it matches §7 and moves on. Verify with
`pnpm exec tsc --noEmit`. Afterwards only the Backend agent maintains it (through the
owner, if changes are ever needed).

### Suggested task order

**Backend:** ① create/verify `domain.ts` → ② `lib/api-utils.ts` → ③ `lib/schemas.ts` →
④ `src/mocks/*` → ⑤ `lib/slug.ts`, `lib/store.ts`, `lib/availability.ts` →
⑥ `app/api/**` routes → ⑦ curl smoke tests (§14) → ⑧ final report.

**Frontend:** ① create/verify `domain.ts` → ② `globals.css` tokens + root layout fonts
& Spanish metadata → ③ `lib/format.ts`, `lib/categories.ts`, `lib/api.ts` →
④ `components/ui` primitives → ⑤ booking components (props-driven, no backend imports) →
⑥ registration wizard (needs `lib/schemas.ts`; if not landed yet, keep it for later) →
⑦ home + `/b/[slug]` profile + `/register/success` (import `@/lib/store` per §8; if the
file doesn't exist yet, do these last) → ⑧ booking wizard (fetches the API) →
⑨ `not-found.tsx`, `error.tsx`, full QA (§14).

If a file you must import doesn't exist yet, continue with tasks that don't need it and
come back later. **Never create another agent's files** (exception: `domain.ts` above).

---

## 4. Tech stack & commands

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3.8, App Router, Turbopack (default), typed routes **active** |
| React | 19.2.8 with **React Compiler ON** (`reactCompiler: true`) |
| Styling | Tailwind CSS 4 via `@theme` tokens in `globals.css` |
| Validation | `zod@4.6.5` — one schema file shared by client forms and Route Handlers |
| Server-only guard | `import 'server-only'` in `store.ts` / `api-utils.ts` |
| Lint style | `@stylistic/eslint-plugin` (dev-only): semicolons mandatory in `.ts`/`.tsx` |
| Language / package manager | TypeScript strict, `@/*` → `./src/*`, pnpm 11 |

```bash
pnpm install                # install dependencies
pnpm dev                    # dev server on http://localhost:3000
pnpm build && pnpm start    # production build + serve
pnpm lint                   # ESLint 9 (flat config) — there is no `next lint`
pnpm exec tsc --noEmit      # typecheck only
```

---

## 5. Global conventions

- **Weekday:** `Weekday = 0|1|2|3|4|5|6` matching `Date#getDay()` — **0 = Sunday**.
  Look up a day's hours with `business.hours[date.getDay()]`.
- **Dates:** naive local `"YYYY-MM-DD"` strings. No timezone math, no `Date` objects in
  the data model. Comparisons: string comparison for date ordering; integer minutes
  for times.
- **Times:** `"HH:mm"` 24h strings in data (`"09:30"`); minutes-from-midnight integers
  for slot math (`startMin: 570`). Display is 12h es-MX ("9:30 a.m.").
- **Prices:** integer `priceCents` (e.g. `35000` = $350.00 MXN), formatted via
  `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`.
- **Comments:** mandatory wherever code is at least a little complex — algorithms,
  tricky conditionals, subtle domain rules, workarounds, special-case handling.
  Briefly explain **what the code does** and, when there is one, **the special case
  it covers**. Prefer 1–2 lines; up to 4–5 lines when the explanation is genuinely
  worth it. Trivial, self-explanatory code stays uncommented — never restate
  syntax. English only. Calibration points in this codebase: slot-overlap math,
  "Primero disponible" resolution, the `globalThis` store cache, the
  service-delete cascade. The invariant notes in the contract files (`domain.ts`,
  `schemas.ts`) are this convention applied to types. Not lint-enforceable —
  upheld in review.
- **Semicolons:** mandatory in every `.ts`/`.tsx` file — statements, type-member
  delimiters, and type-alias closings. Enforced by ESLint
  (`@stylistic/semi` + `@stylistic/member-delimiter-style`) via `eslint.config.mjs`.
- **Spanish copy is inline** in components — no i18n framework in this MVP.
- **Next.js policy:** if you are not 100% sure about a Next.js 16.3 API, STOP and ask
  the owner for the docs/skills instead of guessing. The owner explicitly wants this.
- **Next.js 16.3 bundled docs:** `.agents/AGENTS.md` is auto-generated by `next dev`
  (never edit or delete it — it regenerates) and points to the framework docs shipped
  in `node_modules/next/dist/docs/`. Honor it: read the relevant guide there before
  writing Next.js code, since 16.3 may differ from your training data.

### Display helpers contract (Frontend, `src/lib/format.ts`)

| Helper | Input → Output |
|---|---|
| `formatPrice(cents)` | `35000` → `"$350.00"` |
| `formatDuration(min)` | `45` → `"45 min"`; `90` → `"1 h 30 min"` |
| `formatTime(minutesFromMidnight)` / `formatTimeString("HH:mm")` | `570` → `"9:30 a.m."` |
| `formatDate(dateStr)` | `"2026-10-06"` → `"mar, 6 de oct"` (es-MX, short) |
| `WEEKDAY_NAMES` / hours summary helpers | es-MX long day names; render weekly hours as a list ("Lunes: 10:00 a.m. – 7:00 p.m." / "Cerrado") |

---

## 6. Folder structure (with ownership)

```
src/
  app/
    layout.tsx                  # F: fonts (next/font), Spanish metadata, <html lang="es">
    page.tsx                    # F: home — business directory (RSC)
    loading.tsx                 # F: home loading skeleton
    error.tsx                   # F: root error boundary (Spanish copy + retry)
    not-found.tsx               # F: Spanish 404
    globals.css                 # F: Tailwind 4 @theme tokens (§11)
    api/                        # B: everything under here
      businesses/route.ts       #   POST create business
      businesses/[slug]/route.ts    # GET one business
      availability/route.ts     #   GET slots
      appointments/route.ts     #   POST create appointment
    register/
      layout.tsx                # F: "use client" — WizardProvider + Stepper
      page.tsx                  # F: step 1 — details
      location/page.tsx         # F: step 2 — address + weekly hours
      services/page.tsx         # F: step 3 — services CRUD
      staff/page.tsx            # F: step 4 — staff CRUD + service assignment
      summary/page.tsx          # F: step 5 — review + submit
      success/page.tsx          # F: RSC — confirmation (reads store by ?b=slug)
      loading.tsx               # F: skeleton for the success page
    b/
      [slug]/page.tsx           # F: business profile (RSC, pure links, no client JS)
      [slug]/loading.tsx        # F: skeleton
      [slug]/book/page.tsx      # F: booking wizard ("use client", Suspense-wrapped)
  components/
    ui/                         # F: primitives (§11)
    home/                       # F: BusinessCard, etc.
    register/                   # F: ServicesEditor, StaffEditor, HoursEditor, StepShell…
    booking/                    # F: ServicePicker, StaffPicker, DateStrip, SlotGrid, BookingSummary…
  lib/
    api-utils.ts                # B: error classes, simulateLatency, shouldFail/failIfRequested, jsonError/jsonIssueResponse, mapStoreError
    schemas.ts                  # B: zod schemas (shared) — Spanish messages (§9)
    store.ts                    # B: in-memory store (server-only) + seeds loading
    availability.ts             # B: pure slot generation (generateSlots, isOverlapping)
    slug.ts                     # B: slugify + collision suffix + reference sampler (makeReference)
    api.ts                      # F: typed client fetch helpers
    format.ts                   # F: display helpers (above)
    categories.ts               # F: category labels / gradients / glyphs
  types/
    domain.ts                   # Shared contract (§7)
  mocks/
    businesses.ts               # B: 4 seed businesses (§12)
    appointments.ts            # B: seedAppointments(now) — relative-date seeds (§12)
```

`B:` = Backend-owned, `F:` = Frontend-owned. The client never imports `src/mocks/*`;
it gets data exclusively from Route Handlers or from server components.

---

## 7. Data model contract — `src/types/domain.ts`

The first agent to start creates this file **verbatim** (comment lines included — they
are the invariants; do not "improve" it):

```ts
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
```

---

## 8. API contract (`src/app/api/**`)

### Global behavior — every Route Handler

- All responses and request bodies are JSON. Success: `200` (GET) / `201` (POST).
- **Simulated latency lives only in the store** (§10): every public store method sleeps
  **300–600 ms**. Route handlers add **no extra sleep** — they just await store methods.
- **`?fail=1`** on *any* request: await ~500 ms, then respond
  `500 { "error": "Error simulado para demos (?fail=1)." }`. Check the flag **before**
  touching the store. This flag is the deterministic way to demo error states (README
  documents it). Implemented as `failIfRequested(request)` in `api-utils.ts` — every
  handler does `const failed = await failIfRequested(request); if (failed) return failed;`
  first thing.
- Error envelope: `{ "error": string }` (Spanish, user-displayable). Validation errors
  additionally include zod-flattened field issues:
  `{ "error": "Revisa los datos e inténtalo de nuevo.", "issues": [{ "path": string, "message": string }] }`
  (identical `path`+`message` pairs are deduplicated — one field can trip two rules
  carrying the same copy). Store errors are mapped centrally by `mapStoreError`
  (`api-utils.ts`): `ConflictError` → 409 slot-taken copy, `NotFoundError` → 404,
  `BadRequestError` → 400 (each with the Spanish message the store or `generateSlots`
  carries), anything else → logged + generic 500.

### Endpoints

**1. `POST /api/businesses`** — create a business (registration summary submit).

Request body (`CreateBusinessInput`):

```ts
{
  name: string               // 2–60
  category: BusinessCategory
  phone: string              // 7–15 digits
  address: string            // 5–120
  city: string               // 2–60
  hours: WeeklyHours         // ≥1 open day, open < close
  services: { id: string; name: string; durationMin: number; priceCents: number }[]  // ≥1
  staff: { id: string; name: string; role: string; serviceIds: string[] }[]          // ≥1
}
```

- Client generates `id`s (`crypto.randomUUID()`) for services and staff so
  `serviceIds` can reference them; the server keeps them and validates
  `staff.serviceIds ⊆ services[].id`.
- Server assigns the business `id`, `slug` (§10), and `createdAt`.
- `201` → the created `Business`. `400` → validation. A service with **no staff
  assigned is allowed** (booking then shows a designed empty state — intentional).

**2. `GET /api/businesses/[slug]`** — one business.
`200` → `Business` (includes services and staff). `404` → `{ "error": "Negocio no encontrado." }`.

**3. `GET /api/availability?business=<slug>&service=<id>&staff=<id|any>&date=<YYYY-MM-DD>`**

- All four params are required. `staff` is a staff id or the literal `"any"`.
- Two sequential store calls (business + appointments) → total latency up to ~1.2 s;
  the wizard's per-date skeleton covers the wait (§13).
- `200` → `TimeSlot[]` sorted by `startMin` (see the algorithm in §10).
  A closed day → `200` with `[]`. A day fully booked → all slots `available: false`.
- `400` → missing/invalid params (incl. date outside today…today+13:
  `"Elige una fecha dentro de los próximos 14 días."`).
- `404` → unknown business (`"Negocio no encontrado."`), unknown service
  (`"Servicio no encontrado."`), unknown staff (`"Integrante no encontrado."`).
- `400 "Nadie ofrece este servicio por ahora."` → `staff=any` (or a staff id) with zero
  eligible staff for that service.

**4. `POST /api/appointments`** — create an appointment (booking confirm + fake pay).

Request body (`CreateAppointmentInput`):

```ts
{
  businessSlug: string
  serviceId: string
  staffId: string | 'any'
  date: string            // "YYYY-MM-DD"
  startMin: number        // multiple of 15
  customerName: string    // 2–60
  customerPhone: string   // 7–15 digits
}
```

- The server **re-runs every domain check** (never trust the client): business/service/
  staff exist, staff provides the service, day open, slot multiple of 15, slot +
  duration ≤ close, not in the past, date within the 14-day window.
- `staffId: 'any'` → resolve to the **first free eligible staff** in `business.staff`
  order; none free → `409`.
- Conflict (specific staff busy, or no free staff for `"any"`):
  `409 { "error": "Ese horario acaba de ocuparse. Elige otro, por favor." }`.
- `201` → the created `Appointment` (with `reference`).

### Store contract (`src/lib/store.ts`, Backend, `import 'server-only'`)

```ts
createStore(): {
  getBusinesses(): Promise<Business[]>          // each call sleeps 300–600 ms
  getBusinessBySlug(slug: string): Promise<Business | null>
  createBusiness(input: CreateBusinessInput): Promise<Business>
  listAppointments(businessId: string): Promise<Appointment[]>
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>  // throws ConflictError | NotFoundError | BadRequestError → mapStoreError → 409 | 404 | 400
}
```

- Module pattern: `globalThis.__pikStore ??= createStore()` so dev HMR doesn't wipe it.
- Seeds are loaded once at creation (§12), with appointments generated **relative to
  the moment the store is first created** so unavailable slots always demo correctly.
- **Who calls what:** server components (home, profile, register/success) call store
  methods directly. Client components only reach data through the four endpoints.
  A Route Handler must never fetch itself over HTTP.

### Client fetch helpers (`src/lib/api.ts`, Frontend)

Wrap `fetch` with typed returns for the four endpoints, throw a `PikApiError` carrying
`status` + Spanish `error` (parsed from the envelope above), and expose
`buildAvailabilityUrl(params)`. No retries at this layer — the UI decides.

---

## 9. Validation contract (`src/lib/schemas.ts`, Backend-owned, shared)

One zod v4 file, imported by both Route Handlers (server) and the registration/booking
forms (client). **Messages are exact product copy — do not reword.**

| Field / context | Rule | Spanish message |
|---|---|---|
| Business name / service name / staff name / customer name | 2–60 chars | `"El nombre debe tener entre 2 y 60 caracteres."` (services: `"El nombre del servicio debe tener entre 2 y 60 caracteres."`) |
| Category | enum | `"Elige una categoría."` |
| Phone (business or customer) | 7–15 digits, spaces/`+`/`-` tolerated | `"Ingresa un teléfono de contacto (7 a 15 dígitos)."` / `"Ingresa tu teléfono (7 a 15 dígitos)."` |
| Address | 5–120 chars | `"La dirección debe tener entre 5 y 120 caracteres."` |
| City | 2–60 chars | `"La ciudad debe tener entre 2 y 60 caracteres."` |
| Hours | ≥1 open day | `"El negocio debe abrir al menos un día."` |
| Hours | valid `"HH:mm"` | `"Usa el formato HH:mm (por ejemplo, 09:30)."` |
| Hours | `open < close` | `"La hora de cierre debe ser posterior a la de apertura."` |
| `durationMin` | 15–240, multiple of 15 | `"La duración debe estar entre 15 y 240 minutos, en múltiplos de 15."` |
| `priceCents` | 1–1_000_000 | `"El precio debe ser mayor a $0 y menor a $10,000 MXN."` |
| Registration services | ≥1 | `"Agrega al menos un servicio antes de continuar."` |
| Staff role | 2–40 chars | `"El rol debe tener entre 2 y 40 caracteres."` |
| Staff serviceIds | non-empty, ⊆ service ids | `"Asigna al menos un servicio a cada integrante."` |
| Registration staff | ≥1 | `"Agrega al menos un integrante antes de continuar."` |
| `date` (booking) | today ≤ date ≤ today+13 | `"Elige una fecha dentro de los próximos 14 días."` |
| `startMin` | multiple of 15 | `"Elige un horario válido."` |

API-generated (non-zod) messages:

| Case | Status | Message |
|---|---|---|
| Unknown business | 404 | `"Negocio no encontrado."` |
| Unknown service (in that business) | 404 | `"Servicio no encontrado."` |
| Unknown staff | 404 | `"Integrante no encontrado."` |
| Staff doesn't provide the service | 400 | `"El integrante no ofrece este servicio."` |
| Nobody provides the service | 400 | `"Nadie ofrece este servicio por ahora."` |
| Slot taken at confirm time | 409 | `"Ese horario acaba de ocuparse. Elige otro, por favor."` |
| Bad request (generic 400 — zod issues envelope, or a store domain re-check at POST: closed day, past slot, slot + duration past close) | 400 | `"Revisa los datos e inténtalo de nuevo."` |
| Unexpected | 500 | `"Algo salió mal. Inténtalo de nuevo en unos momentos."` |
| Demo flag | 500 | `"Error simulado para demos (?fail=1)."` |

---

## 10. Domain rules (Backend, `src/lib/availability.ts`, `src/lib/slug.ts`)

### Slot generation (normative algorithm)

```
generateSlots(business, service, staffParam, date):
  dayHours = business.hours[date.getDay()]
  if dayHours == null            → return []                        // closed day
  eligible = staffParam == 'any'
    ? business.staff.filter(s => s.serviceIds ∋ service.id)
    : [business.staff.find(s => s.id == staffParam)]               // must provide the service
  if eligible is empty           → 400 "Nadie ofrece este servicio por ahora."

  candidates = openMin … (closeMin − service.durationMin), step 15 (inclusive bounds)
  todayLocal = date == today's local date
  for start in candidates:
    if todayLocal && start <= nowMinutesLocal  → skip entirely      // past slots are
                                                                     // NOT returned
    free = eligible staff with NO appointment on `date` overlapping
           [start, start + service.durationMin)                     // overlap:
                                                                     // a.start < end &&
                                                                     // start < a.start + a.durationMin
    slots.push({ startMin: start, available: free.length > 0,
                 staffId: free[0]?.id ?? null })                     // first eligible
                                                                     // in staff order
  return slots sorted by startMin
```

- **15-minute grid**, slot must **fit fully** before closing, **no buffers** between
  appointments, **no lead time** (only past times excluded), window = **today…today+13**.
- Unavailable (staff busy) slots are returned with `available: false` so the UI renders
  them disabled. `staffId` when a specific staff was queried = that staff's id (null if busy).
- Implementation: `generateSlots(business, service, staffParam, date, appointments, now?)`
  — pure; the availability route passes store-fetched appointments, `now` defaults to the
  current clock. `isOverlapping` is exported and shared with the store's conflict check.
  If a day's open time falls off the 15-min grid, the first candidate rounds **up** to the
  next grid point (`TimeSlot.startMin` must stay on-grid, §7).

### Slug, reference, ids

- `slugify`: lowercase, strip accents (NFD), non-alphanumeric → `-`, collapse/trim `-`.
  Collision → append `-2`, `-3`, … until free. Empty result (punctuation-only name) →
  fallback base `negocio`.
- `reference`: `"PIK-"` + 6 chars sampled from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`
  (no ambiguous chars), cryptographically random, unique within the store. The sampler
  lives in `slug.ts` as `makeReference(used)`; seed appointments mint their references
  through it first, so seeded and generated codes can never collide.
- Ids: `crypto.randomUUID()` for everything created at runtime. Server assigns business
  `id`, `slug`, `createdAt`; keeps client-provided service/staff `id`s. Exception: seed
  businesses/services/staff use stable readable prefixed ids (`biz-…`, `svc-…`, `staff-…`)
  so §14 curl commands and the cross-referenced appointment seeds stay deterministic.

### Cascade

Deleting a service in the registration wizard **removes its id from every staff
member's `serviceIds`** (Frontend implements this in the wizard state; businesses are
created atomically, so no server-side cascade is needed).

---

## 11. Design system & UI primitives (Frontend)

### Tailwind 4 tokens — `globals.css` (exact values, warm & elegant)

```css
@theme {
  --color-cream: #FAF5EF;        /* page background */
  --color-sand: #F2EAE0;        /* subtle surfaces, input backgrounds */
  --color-card: #FFFFFF;         /* cards */
  --color-line: #E7DDD2;         /* borders */
  --color-espresso: #2B2320;    /* primary text */
  --color-taupe: #6E6057;       /* secondary text */
  --color-plum: #6C3B54;        /* primary accent: buttons, active steps */
  --color-plum-deep: #53293F;   /* hover / pressed */
  --color-terracotta: #BC6B3C;  /* accent: category highlights */
  --color-sage: #7E9B7A;        /* success / available */
  --color-danger: #B34135;      /* errors */
}
```

### Fonts & metadata

- `next/font/google`: **Fraunces** (display: brand, h1/h2, big numbers) and
  **Instrument Sans** (body/UI), as CSS variables `--font-display` / `--font-sans`
  mapped in `@theme` (`--font-sans`, `--font-display`). Self-hosted at build time —
  no runtime external service.
- Root layout keeps `<html lang="es">`; Spanish metadata: title
  `"PIK — Reservas para salones, barberías, spas y estudios de uñas"` + Spanish
  description.

### Shape & feel

- `rounded-2xl` cards, `rounded-full` pills/badges, `shadow-xs/sm` soft warm shadows.
- Mobile-first: wizards/content `max-w-md` centered on mobile, wider grids from `sm`
  (cards 2-col, slot grid 3–4 cols mobile / 6–8 cols desktop). Primary buttons
  full-width on mobile; sticky bottom CTA bar on wizard steps (with safe-area padding);
  hit targets ≥ 44 px.
- Business covers: per-category linear gradient (from `categories.ts`) + large inline
  SVG glyph. **No external images anywhere.**

### `src/lib/categories.ts` (Frontend)

`Record<BusinessCategory, { label: string; glyph: SVGComponent; gradient: [string, string] }>`
with Spanish labels: `salon` → "Salón de belleza", `barbershop` → "Barbería",
`spa` → "Spa", `nail-studio` → "Estudio de uñas". Simple, distinct line-art glyphs
(scissors / razor / leaf / polish bottle).

### `components/ui` primitives

`Button` (primary/secondary/ghost/danger; sizes; `loading` → disabled + Spinner),
`Input`, `Select`, `Field` (label + control + hint + error, wired with
`aria-describedby` / `aria-invalid`), `Card`, `Badge`, `Stepper` (numbered steps,
current highlighted, completed clickable), `Skeleton`, `Spinner`, `EmptyState`
(title + body + optional action), `ErrorPanel` (message + "Reintentar" retry action).

---

## 12. Seed data requirements (Backend, `src/mocks/*`)

Four businesses, one per category, Spanish, Mexico City vibe (names are suggestions —
keep one per category):

1. **Barbería Don Rafa** — barbershop, Coyoacán — closed Mondays; Tue–Sat 10:00–19:00;
   Sun 10:00–14:00. Services like Corte clásico (30, $150), Corte + barba (45, $220),
   Afeitado de navaja (30, $180), Arreglo de barba (15, $100).
2. **Salón Aura** — salon, Roma Norte — Tue–Sat 09:30–19:00; Sun closed; Mon 11:00–17:00.
   Corte + peinado (60, $380), Lavado + peinado (45, $250), Tinte completo (120, $850),
   Tratamiento de keratina (90, $650).
3. **Spa Sereno** — spa, Polanco — Mon–Sun 10:00–20:00. Masaje relajante (60, $650),
   Masaje descontracturante (75, $780), Facial hidratante (60, $700), Aromaterapia (30, $400).
4. **Estudio de Uñas Luna** — nail studio, Condesa — Wed–Sun 11:00–18:00; Mon–Tue closed.
   Manicure tradicional (45, $250), Manicure en gel (75, $450), Pedicure spa (60, $380),
   Uñas acrílicas (90, $600).

Rules for seeds:

- Every business: 3–5 services, **2–3 staff, each assigned ≥2 services**, ≥1 business
  closed on Monday, ≥1 open Sundays (both covered above).
- **Seeded appointments:** 4–8 per business, spread across **today, +1, +2**, at times
  that are valid per §10 (inside hours, multiple-of-15 starts, service durations,
  no double-booking per staff). Spread them across different staff and times, and
  include at least a couple of same-time different-staff appointments (demonstrates
  that availability is per-staff). **Generate dates relative to store-creation time**
  so the demo never goes stale. Don't fully block any single day.
- `mocks/appointments.ts` implements this as `seedAppointments(now)`: each business
  defines one per-open-day pattern (times relative to that day's opening hour, so
  every open weekday fits), replayed on the open days inside today..+2,
  design-major interleaved and capped at 8. Boot-time invariant checks **throw**
  on any invalid seed (unknown ids, staff not providing the service, out-of-hours,
  double-booking) — a broken seed is a broken demo.

---

## 13. UX contract (Frontend)

### Registration wizard — `/register/*`

Steps (URLs): ① `/register` details (name, category as choice cards, phone) →
② `/register/location` (address, city + weekly hours grid with "Cerrado" per day and
quick presets like "Mar–Sáb 10:00–19:00") → ③ `/register/services` (add/edit/delete
rows; empty state with "Agrega tu primer servicio") → ④ `/register/staff` (add/edit/
delete members; each row has service checkboxes) → ⑤ `/register/summary` (grouped
review: Detalles / Ubicación y horario / Servicios / Equipo, each with an "Editar"
link back to its step) → submit.

- Wizard state: `WizardProvider` in the client `register/layout.tsx` (reducer), persisted
  to `sessionStorage` key **`pik-registration-draft`** (write-through on every change,
  restore on mount, **clear after successful POST**, then
  `router.push('/register/success?b=<slug>')`).
- Draft shape mirrors `CreateBusinessInput` with optional step-1/2 fields and required
  `services`/`staff` arrays (ids via `crypto.randomUUID()`).
- **Step guards:** each step page redirects to the **first incomplete step** when its
  own prerequisites are missing (step 1 complete = valid name+category+phone; step 2 =
  address+city+hours; step 3 = ≥1 service; step 4 = ≥1 staff, each with ≥1 service).
- Copy hint on step 4: "Agrégate a ti mismo/a si trabajas solo/a."
- Inline validation uses the shared zod schemas; validate on blur/change **after the
  first submit attempt** on each step (no nagging while typing first time).
- Submit: loading state (disabled + Spinner) → on 201 clear draft + navigate to
  `/register/success` (RSC: reads the store via `?b=`; `notFound()` when missing) →
  shows confirmation + link to the new business's public profile `/b/[slug]`.
- On 400 show the issue messages inline (banner at top); on 500 show `ErrorPanel`
  with retry.

### Business profile — `/b/[slug]` (pure RSC)

Cover (category gradient + glyph), name (display font), category badge, address + city,
phone, weekly-hours summary, staff preview (name + role), and service cards
(name, duration, price, "Reservar" → `/b/[slug]/book?service=<id>`).
**Zero client JS on this page — links only.** `notFound()` on unknown slug.

### Booking wizard — `/b/[slug]/book` (client, Suspense-wrapped for `useSearchParams`)

Selections live in URL search params: `service`, `staff` (id | `any`), `date`
(YYYY-MM-DD), `time` (startMin). Step is derived:

| Params present | Step (all four steps inside this one route) |
|---|---|
| none | 1 — ServicePicker (grid of service cards) |
| `service` | 2 — StaffPicker: "Primero disponible" + staff who provide the service. Empty → EmptyState + back to services. |
| `service`+`staff` | 3 — DateStrip (next 14 days; closed days disabled) + SlotGrid (fetched per date; skeleton while loading; unavailable slots rendered disabled) |
| all four | 4 — BookingSummary: service, staff, date/time, price; customer name + phone fields; "Confirmar y pagar" |

- Step 3 default date: today if open, else the next open day within the window.
- Staff step shows name + role + assigned-service chips; "Primero disponible" resolves
  server-side to the first free staff (§10).
- Confirm: button → fake payment spinner **~1.2 s** → `POST /api/appointments` →
  on `201` show the success screen (reference code, full recap, "Hecho" → back to
  profile). On **409** show the conflict message and send the user back to step 3 with
  the same date preselected (fresh slots). On 400/500 → `ErrorPanel` with retry.
- The success screen is ephemeral client state — refreshing returns to step 4
  (known limitation, §15). Customer name/phone are local state only (accepted loss).
- Completed steps are clickable in the `Stepper` to go back.

### States matrix (every cell is required)

| View | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Home | `loading.tsx` skeleton cards | seeded ⇒ never empty; still render a graceful empty grid message | `error.tsx` boundary | — |
| Profile | `loading.tsx` skeleton | (won't occur: seeds) | 404 via `notFound()` | — |
| Registration steps | submit spinner | no services yet / no staff yet (EmptyState + CTA) | inline field errors; 400 banner; 500 `ErrorPanel` + retry | redirect to `/register/success` |
| Booking wizard | business fetch + per-date availability skeletons | closed day notice; day fully booked ("No hay horarios disponibles este día. Prueba otra fecha."); no staff for service | 409 → back to step 3 + message; 404 business → message + home link; 500/?fail=1 → `ErrorPanel` + "Reintentar" | confirmation with reference + recap |

### Accessibility baseline (WCAG-minded, semantic-first)

Every input has a real `<label>` (error wired via `aria-describedby` + `aria-invalid`);
slots are `<button disabled>` (disabled + visually distinct + text label — never color
alone); step changes move focus to the step heading; contrast ≥ AA with the palette
above (verified pairs: espresso/cream ≈ 13:1, taupe/cream ≈ 5.5:1, white/plum ≈ 7:1).

---

## 14. Verification & handoff (both agents)

Before declaring done, from the repo root:

```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

Backend — smoke-test the API with `pnpm dev` running:

```bash
curl -s "localhost:3000/api/businesses/barberia-don-rafa" | head -c 400
curl -s "localhost:3000/api/availability?business=barberia-don-rafa&service=<svcId>&staff=any&date=$(date +%F)"
curl -s -X POST localhost:3000/api/appointments -H 'content-type: application/json' \
  -d '{"businessSlug":"barberia-don-rafa","serviceId":"<svcId>","staffId":"any","date":"<today+2>","startMin":600,"customerName":"Ana Prueba","customerPhone":"5512345678"}' -i
# then repeat the same POST → must return 409
#   NB: with "staffId":"any" a repeat legitimately books the NEXT free eligible
#   staff (201 each) until every eligible staff is busy — only then 409. For a
#   deterministic 409 pin "staffId":"staff-rafa-rafa" and repeat once. Seed ids
#   are stable, e.g. service svc-rafa-corte-clasico, staff staff-rafa-rafa.
curl -s "localhost:3000/api/businesses/barberia-don-rafa?fail=1" -i   # must return 500
```

Also verify: `400` on a bad POST body; `404` on unknown slug; closed day → `[]`
(the closed-day `[]` also wins over availability 400s — §10 order); past-time slots
absent for today (run before the day's closing time; after it, today is `[]`).

Frontend — manual QA on `pnpm dev` at mobile viewport (390×844) and desktop:
both flows end-to-end; refresh mid-registration (draft must restore); register with a
service no staff provides then book it (empty staff state); book the same slot from
two tabs **with the same staff member pinned** (second must hit 409 and recover — with
"Primero disponible" in both tabs, the second confirm books the next free staff
instead); `?fail=1` on an API call (error panel +
retry works); unknown slug → 404 page; slot unavailability visible; `?fail=1` docs
note will live in README.

**Final report (both agents):** what was built, any deviation from this file and why,
anything the other agent should know.

---

## 15. Known limitations (by design — do not "fix" silently)

- **In-memory store resets** on server restart, and on Vercel each instance has its own:
  a business created via POST may 404 when another instance serves the next request.
  Seeded businesses exist everywhere. `pnpm dev` (single instance) demos the full loop
  reliably. This is the #1 reason post-MVP needs a real database.
- Refreshing the booking success screen returns to the confirm step (success is
  ephemeral client state).
- Naive local dates: server and client may disagree near midnight across timezones.
- No persistence, no auth, no real payments (MVP constraints).

---

## 16. Out of scope / post-MVP pointers

Real database + auth, real payments (e.g. Stripe), timezone-aware booking, i18n
framework, email/SMS confirmations, reviews & ratings, search/filters, admin
dashboard, multi-service cart, recurring appointments, PPR/cache components, tests &
CI. (Kept here so agents don't "helpfully" build them.)

---

## 17. Documentation duties

- Deviating from this file for any reason → say it explicitly in your final report;
  never let the codebase drift from this contract unannounced.
- `README.md` and `DECISIONS.md` will be authored centrally **after implementation**,
  from this file and the planning record. Don't create them yourselves.
