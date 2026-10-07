# DECISIONS.md — What was chosen, why, and what was rejected

The rationale register for this MVP. The *what* and *how* live in
[`AGENTS.md`](./AGENTS.md) (the normative contract); this file records the *why*
and the rejected alternatives. Decisions were settled in an AI-assisted Q&A with
the project owner before any code was written; the owner made or ratified every
entry below.

**Index**

| # | Decision | # | Decision |
|---|---|---|---|
| D1 | Spanish copy, English code | D19 | 14-day booking window |
| D2 | MXN, integer cents | D20 | "Primero disponible" staff option |
| D3 | Route Handlers + in-memory store | D21 | 409 conflict + recovery flow |
| D4 | RSC read the store directly; clients fetch the API | D22 | Reference codes `PIK-XXXXXX` |
| D5 | Mutations via Route Handlers, not Server Actions | D23 | Seeds relative to today |
| D6 | Simulated latency (300–600 ms) | D24 | Service deletion cascade (wizard state) |
| D7 | `?fail=1` deterministic error flag | D25 | Warm & elegant design system |
| D8 | zod as the only runtime dependency | D26 | Fraunces + Instrument Sans via `next/font` |
| D9 | `server-only` guard on the store | D27 | Hand-rolled primitives, no component library |
| D10 | Minimal API surface (4 endpoints) | D28 | CSS/SVG covers, no external images |
| D11 | Registration: URL per step + sessionStorage | D29 | Inline Spanish strings, no i18n framework |
| D12 | Require ≥1 staff member | D30 | Light theme only |
| D13 | Booking: profile (RSC) + one wizard route | D31 | Accessibility as a baseline |
| D14 | Booking selections in URL search params | D32 | Naive local dates, no timezone math |
| D15 | Light fake payment | D33 | One service per appointment |
| D16 | Home = business directory | D34 | No tests; lint + typecheck + build |
| D17 | Home/profile/success are RSC; wizards are client | D35 | Ephemeral booking success screen |
| D18 | Slot rules (15-min grid, no buffers, no lead time) | D36 | Semicolons mandatory, `@stylistic`-enforced |
| D37 | Comments mandatory on non-trivial code | D38 | Centralized error mapping (`mapStoreError`) |
| D39 | Store domain 400s reuse the generic copy | D40 | Stable readable seed ids |
| D41 | `negocio` fallback slug | D42 | Availability: two sequential store calls |

---

## A. Product & language

### D1 — Product copy in Spanish, everything else in English
**Chosen:** every user-visible string is Spanish; code, identifiers, comments, and
docs are English. `<html lang="es">`.
**Why:** the product targets a Spanish-speaking (Mexico City) audience; the codebase
should stay readable for international reviewers and tools.
**Rejected:** all-English (wrong audience for a beauty marketplace demo), all-Spanish
(hurts portfolio readability and tooling).

### D2 — Prices in MXN, stored as integer cents
**Chosen:** `priceCents` integers (35000 = $350.00 MXN), rendered via
`Intl.NumberFormat('es-MX', { currency: 'MXN' })`.
**Why:** Mexico City vibe; integers avoid float rounding in comparisons and sums.
**Rejected:** USD/EUR/CRC (audience mismatch), decimal floats (rounding bugs).

---

## B. Data & architecture

### D3 — Mock data via Route Handlers + in-memory store
**Chosen:** seed files in `src/mocks/` load once into a module-level store
(`globalThis` cached so dev HMR doesn't wipe it); Route Handlers simulate the real
API; registered businesses become bookable immediately.
**Why:** simulates a real product end-to-end (loading, error, success states) while
honoring "no database, no external services" — and it connects both flows: register,
then book your own business.
**Rejected:** static files imported by components (no loading/error states to demo,
registration can't produce a bookable business); stateless Route Handlers (writes
evaporate on refresh — kills the two-tabs 409 demo).

### D4 — Server components read the store directly; client components go through the API
**Chosen:** home, profile, and registration-success pages import the store like a
data layer; both wizards `fetch` the four Route Handlers.
**Why:** RSC self-fetching over HTTP is an anti-pattern; clients need the real
request/response cycle for their states. One rule, applied consistently.
**Rejected:** everything through `fetch` (RSC self-fetch anti-pattern), everything
direct (client can't reach module state without it).

### D5 — Mutations via Route Handlers, not Server Actions
**Chosen:** `POST /api/businesses`, `POST /api/appointments` from client code.
**Why:** one consistent data pattern for all client-server communication; mutations
get natural loading/error/conflict states in the wizards; mirrors how a real app
would call a backend.
**Rejected:** Server Actions (idiomatic but a second data pattern in a tiny app;
also mixes error envelopes), mixed approach (two patterns, more contracts).

### D6 — Simulated latency: 300–600 ms on every store call
**Chosen:** all store reads/writes sleep 300–600 ms; Route handlers add no extra
sleep (one latency source, no doubling).
**Why:** loading skeletons and submit spinners must be observable in demos — with
in-memory data they'd otherwise never appear.
**Rejected:** no latency (states invisible), random failures (flaky demos).

### D7 — `?fail=1` deterministic error flag on every API route
**Chosen:** any request with `?fail=1` → ~500 ms → `500` with Spanish error message.
**Why:** error states need a reliable, on-demand way to be demoed and QA'd
(error panels, retry buttons, 409 recovery), documented in the README.
**Rejected:** random error rate (unreliable demos), no error demoing at all.

### D8 — zod as the only runtime dependency
**Chosen:** `zod@4.6.5`; schemas live in one Backend-owned file imported read-only
by the frontend. Dates and times use native `Intl` + minute arithmetic; URL state
uses plain `useSearchParams`.
**Why:** one source of truth for validation rules and Spanish messages, shared by
client forms and Route Handlers; everything else the app needs is trivial with
native APIs — the smallest dependency surface possible.
**Rejected:** zero deps (validation duplicated by hand, drift risk), zod + date-fns
(our date math is string/minute arithmetic — little value), zod + date-fns + nuqs
(nice DX, not justified in a 4-endpoint demo).

### D9 — `server-only` guard on the store
**Chosen:** `import 'server-only'` in `store.ts` / `api-utils.ts`.
**Why:** makes the server/client boundary a build error rather than a convention —
crucial with two agents working in parallel.
**Rejected:** convention only (too easy to violate silently).

### D10 — Minimal API surface: exactly four endpoints
**Chosen:** `POST /api/businesses`, `GET /api/businesses/[slug]`,
`GET /api/availability`, `POST /api/appointments`.
**Why:** every endpoint exists because a client screen consumes it. The home
directory and profile are RSC reading the store directly, so a list endpoint had no
consumer.
**Rejected:** a symmetric `GET /api/businesses` list endpoint (dead code — rejected
even though it makes the API look "complete").

---

## C. Routing & state

### D11 — Registration wizard: one URL per step + sessionStorage draft
**Chosen:** `/register` → `/register/location` → `/register/services` →
`/register/staff` → `/register/summary`, with state in a client `WizardProvider`
persisted to `sessionStorage` (`pik-registration-draft`), write-through, cleared
after a successful POST. Steps guard prerequisites and redirect to the first
incomplete step.
**Why:** deep-linkable steps, working browser back/forward, refresh-proof drafts,
and an App Router structure that mirrors the product.
**Rejected:** single route with internal step state (no deep-linking, back exits
the flow), all state in search params (services/staff arrays don't belong in a URL).

### D12 — Require ≥1 staff member (and ≥1 service) to register
**Chosen:** at least one service, at least one staff member, each staff member
assigned ≥1 service. UI hint: "Agrégate a ti mismo/a si trabajas solo/a."
**Why:** booking needs someone to assign the service to; an owner-operator can just
add themselves. Keeps both flows total (no "unassigned" fallback path).
**Rejected:** allowing zero staff (forces a fallback owner in the booking flow —
more states, no demo value). Note: a service with *no* staff assigned is allowed and
books into a designed empty state.

### D13 — Booking flow: RSC profile + one client wizard route
**Chosen:** `/b/[slug]` is a server-rendered profile with zero client JS (links to
`/b/[slug]/book?service=<id>`); all four booking steps live inside `/b/[slug]/book`.
**Why:** the profile is a perfect RSC showcase (static-ish content, links only);
the wizard is interactive by nature and doesn't need four routes to change steps.
**Rejected:** multi-route wizard steps (4× the routes and state-passing for no UX
gain), single progressive page (a very long page on mobile, weak deep-linking).

### D14 — Booking selections live in URL search params
**Chosen:** `service`, `staff` (id | `any`), `date`, `time` (startMin); the current
step is *derived* from what's present. Customer name/phone are local state only.
**Why:** shareable, refresh-safe selections; back button unwinds naturally; the
wizard is stateless except for the final form fields.
**Rejected:** context + sessionStorage for bookings (the URL already encodes
everything; duplicated mechanism), context only (refresh loses the whole booking).

### D15 — Light fake payment
**Chosen:** the summary shows the total, "Confirmar y pagar" runs a fake ~1.2 s
processing spinner, then `POST /api/appointments` and the success screen with the
`PIK-XXXXXX` reference and recap.
**Why:** tells the full marketplace story (booking *and payment*) for minimal scope.
**Rejected:** plain "Confirm" without payment (drops the marketplace half of the
concept), a mock card form (a whole extra form's scope for a demo payment).

### D16 — Home page = business directory
**Chosen:** hero + cards for the four seeded businesses (cover, name, category,
city, services count) + "Registra tu negocio" CTA.
**Why:** a real marketplace needs an entry point to booking and shows the domain at
a glance; the four categories demo the category system.
**Rejected:** simple two-link landing (wastes the strongest first impression),
redirect to a featured business (no way to discover or reach registration).

### D17 — Rendering split: RSC where possible, client only where needed
**Chosen:** RSC: home, profile, registration success (read the store directly, with
`loading.tsx` skeletons). Client: both wizards + root `error.tsx`.
**Why:** demonstrates good RSC judgment — interactive state (wizards) is the only
thing that needs JS; everything else streams from the server.
**Rejected:** making everything client-side (throws away the framework's strength),
forcing profile interactions into RSC (none needed — links suffice).

---

## D. Booking domain rules

### D18 — Slot generation: 15-min grid, full fit, no buffers, no lead time
**Chosen:** candidates from opening to `close − duration` in 15-min steps (inclusive
bounds); the slot must fit fully before closing; no buffers between appointments;
past times are simply not returned.
**Why:** the simplest defensible model — predictable grids, easy reasoning, easy to
demo; buffers and lead times are policy knobs better left to v2.
**Rejected:** duration-aligned starts (confusing grids), 10-min buffers (hides
availability for no demo value), 2-hour lead time (hides same-day booking — the
most impressive demo path).

### D19 — Booking window: today … today + 13
**Chosen:** dates outside the 14-day window are rejected with a Spanish message.
**Why:** bounded data for the date strip and slot fetches; long enough for realistic
planning, short enough to keep fully-booked states reachable.
**Rejected:** 30/60/90-day windows (more scrolling, no extra demo value),
unbounded (unbounded appointment seeds, stale demo data).

### D20 — "Primero disponible" staff option
**Chosen:** the staff step offers "Primero disponible" plus staff who provide the
service; `any` resolves server-side to the first free eligible staff in `business.staff`
order; availability for `any` is the union of eligible staff.
**Why:** the most common real-world booking UX; also demonstrates that availability
is per-staff (same-time slots can differ across staff).
**Rejected:** specific staff only (slower booking, weaker domain demo).

### D21 — 409 conflict at confirm time + recovery flow
**Chosen:** the server re-runs every domain check at POST; a taken slot → `409`
"Ese horario acaba de ocuparse…" and the wizard returns to the time step with the
same date preselected and fresh slots.
**Why:** double-booking is *the* race condition of booking apps; handling it well
(client can't trust stale availability) is the point of the demo.
**Rejected:** silent best-effort booking (dishonest), last-write-wins (corrupts the
schedule story).

### D22 — Reference codes `PIK-XXXXXX`
**Chosen:** `PIK-` + 6 chars sampled from an unambiguous alphabet
(no `0/O`, `1/I/L`), cryptographically random, unique per store.
**Why:** the success screen needs a concrete, speakable artifact of the booking —
like a real product's confirmation code.
**Rejected:** UUIDs as confirmation codes (unspeakable), sequential ids (implies
a real counter we don't have).

### D23 — Seeded appointments generated relative to "today"
**Chosen:** seed appointments are computed at store-creation time for today/+1/+2,
valid per the slot rules, spread across staff, including same-time different-staff
pairs; no day fully blocked.
**Why:** static dates go stale — unavailable slots must be visible forever; the
same-time pairs demo per-staff availability.
**Rejected:** hardcoded dates (demo dies within days), no seeded appointments
(nothing to show as unavailable).

### D24 — Deleting a service cascades to staff assignments
**Chosen:** in the wizard state, removing a service removes its id from every staff
member's `serviceIds`.
**Why:** prevents orphaned references at creation time; businesses are created
atomically so no server-side cascade is needed.
**Rejected:** keeping orphaned ids (invalid payload), blocking service deletion
with assignments (hostile wizard UX).

---

## E. Registration flow

*(D11 and D12 above cover routing and minimums; repeated decisions omitted.)*

---

## F. Design & UX

### D25 — Warm & elegant design system
**Chosen:** cream/sand/espresso/taupe neutrals, plum primary accent, terracotta and
sage in support; `rounded-2xl` cards, `rounded-full` pills, soft shadows.
**Why:** fits the beauty & wellness domain — calm, premium, and distinctive next to
default-Tailwind apps.
**Rejected:** clean minimal SaaS (soulless for the domain), vibrant & playful (wrong
tone for a payments-adjacent product), premium editorial black & white (beautiful
but cold for salons).

### D26 — Fraunces + Instrument Sans via `next/font/google`
**Chosen:** display serif for brand/heading/big numbers, humanist sans for UI;
self-hosted at build time as `--font-display` / `--font-sans`.
**Why:** the serif/sans pairing carries the "warm & elegant" direction; `next/font`
downloads at build time only — no runtime external service.
**Rejected:** system fonts (kills the aesthetic), runtime font CDN (violates the
no-external-services constraint), Inter everywhere (generic).

### D27 — Hand-rolled primitives, no component library
**Chosen:** a small `components/ui` set (Button, Input, Select, Field, Card, Badge,
Stepper, Skeleton, Spinner, EmptyState, ErrorPanel) built on Tailwind 4 `@theme`
tokens.
**Why:** total control of the look, no dependency surface, and every state
(loading/empty/error) designed on purpose — the exercise is the value.
**Rejected:** shadcn/ui + Radix (fast, but generic aesthetics and extra deps the
constraints don't want).

### D28 — CSS gradients + inline SVG glyphs, zero external images
**Chosen:** business covers are per-category gradients + a large line-art glyph
(scissors / razor / leaf / polish bottle).
**Why:** no external images = no remote service, no layout shift, instant loads,
always-available covers for any registered business.
**Rejected:** stock photos (external, license risk, per-business uploads impossible
in the MVP), UI avatar libraries (generic).

### D29 — Inline Spanish strings, no i18n framework
**Chosen:** copy written directly in components.
**Why:** one locale by definition of the MVP; a framework would be unused
machinery (flagged for v2 in the README).
**Rejected:** `next-intl`/message catalogs now (premature; would double every
screen's boilerplate).

### D30 — Light theme only
**Chosen:** no dark mode in the MVP.
**Why:** halves the design QA surface; the warm palette is the identity.
**Rejected:** dark mode toggle (splits effort across two unfinished themes).

### D31 — Accessibility as a baseline, not a feature
**Chosen:** real `<label>`s, `aria-describedby` + `aria-invalid` on errors, focus
moved to step headings, disabled `<button>` slots (never color alone), AA contrast
on verified pairs.
**Why:** semantic-first HTML gets most of this for free; slots and wizard steps are
the classic a11y traps.
**Rejected:** decorative `div`s with `onClick` (would pass a visual check and fail
real usage).

---

## G. Engineering practices

### D32 — Naive local dates, no timezone math
**Chosen:** dates are `"YYYY-MM-DD"` strings; times are `"HH:mm"` or
minutes-from-midnight; comparisons are string/integer comparisons.
**Why:** timezone correctness is a real product's problem; here it would add
complexity with zero demo value. Known edge: server/client may disagree near
midnight (documented in AGENTS.md §15).
**Rejected:** full tz-aware datetime handling (out of scope, error-prone),
UTC-everywhere (still tz math, and wrong for local businesses).

### D33 — One service per appointment
**Chosen:** the booking wizard books exactly one service per appointment.
**Why:** the smallest honest cart; multi-service carts (staff overlap resolution,
per-item pricing) are a v2 feature.
**Rejected:** multi-service cart (doubles the confirm logic and the summary UI).

### D34 — No tests; verification = lint + typecheck + build + manual QA script
**Chosen:** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, plus the curl smoke
tests and manual QA checklist in AGENTS.md §14.
**Why:** explicitly out of scope per the owner; strong static typing + shared zod
schemas + a written QA script is the honest MVP substitute.
**Rejected:** minimal unit tests for the slot algorithm (valuable, but the owner
scoped it out — noted as the first thing to add in v2).

### D35 — Ephemeral booking success screen
**Chosen:** the confirmation is client state; refreshing the success view returns to
the confirm step.
**Why:** a dedicated success route needs either persisted appointments (no DB) or
client state anyway; documented as a known limitation instead of half-solved.
**Rejected:** a `?booked=1` URL flag (fake refresh-safety), writing bookings to
`localStorage` and hydrating a success route (extra machinery, still not shareable).

### D36 — Semicolons mandatory in all `.ts`/`.tsx` (owner-directed, mid-build)
**Chosen:** every statement, type-member delimiter, and type-alias closing uses `;`,
enforced by ESLint via `@stylistic/semi` + `@stylistic/member-delimiter-style`
(`@stylistic/eslint-plugin`, owner-approved dev-only dependency; see
`eslint.config.mjs`). Scope is `.ts`/`.tsx` only — `.mjs`/`.css` untouched.
**Why:** two agents writing in parallel need one mechanical style gate instead of a
convention; core ESLint `semi` cannot see TS type members (verified empirically
before choosing), and typescript-eslint v8 removed its stylistic rules —
`@stylistic` is their official successor.
**Rejected:** statements-only core rule (the type-heavy contract files would pass
lint half-styled), a custom inline ESLint rule (zero-dep but AST logic living in
the lint config), convention-only (unenforceable across two parallel agents).

### D37 — Comments mandatory on non-trivial code (owner-directed, mid-build)
**Chosen:** any code that is at least a little complex — algorithms, tricky
conditionals, subtle domain rules, workarounds, special-case handling — carries a
brief comment explaining **what it does** and, when relevant, the special case it
covers. 1–2 lines preferred, up to 4–5 when the explanation warrants it;
trivial, self-explanatory code stays uncommented; comments are English and
explain intent, not syntax.
**Why:** the codebase is read by people who didn't write it (owner, reviewers,
future maintainers), and the domain has genuinely subtle spots — slot-overlap
math, "Primero disponible" resolution, the `globalThis` store cache, the wizard's
service-delete cascade — whose reasoning deserves to live next to the code.
**Rejected:** the original no-comments convention (terse, but hides intent in
exactly the places where intent matters most), commenting everything (noise that
rots fast), lint enforcement (no reliable rule can judge "complex enough") —
review-enforced convention instead.

### D38 — Centralized error mapping and fail-flag handling (implementation-time)
**Chosen:** `mapStoreError(error)` and `failIfRequested(request)` live in
`api-utils.ts`; every handler is the same three-step shape — `failIfRequested` →
zod parse → store call — with one shared error→response mapping.
**Why:** four handlers × a hand-rolled mapping each is drift waiting to happen;
one function makes the 409/404/400/generic-500 envelope provably identical
everywhere, and unknown throwables get logged once in one place.
**Rejected:** per-route try/catch switches (four copies to keep in sync),
throwing `Response` objects from the store (couples domain logic to HTTP).

### D39 — Store domain-check failures at confirm time reuse the generic 400 copy (implementation-time)
**Chosen:** closed day / past slot / slot-past-close at `POST /api/appointments`
time throw `BadRequestError` carrying the generic
"Revisa los datos e inténtalo de nuevo." message.
**Why:** §9 defines no bespoke copy for these cases and inventing new messages
post-hoc would drift the message table; the zod layer already stops every
client-reachable path, so these are defense-in-depth re-checks.
**Rejected:** new per-case Spanish messages (table drift for unreachable-in-UI
cases), letting them 500 (wrong status for a client mistake).

### D40 — Stable readable seed ids + shared reference sampler (implementation-time)
**Chosen:** seed businesses/services/staff use prefixed readable ids
(`biz-…`, `svc-…`, `staff-…`); runtime-created entities keep
`crypto.randomUUID()`. Seed appointments mint references through the same
`makeReference(used)` the store uses (it lives in `slug.ts`).
**Why:** §14 curl commands and seed cross-references become deterministic and
human-readable in demos; a shared sampler means seeded and generated `PIK-XXXXXX`
codes can never collide by construction.
**Rejected:** UUIDs for seeds (unreadable, smoke tests break on every regen),
a second reference sampler inside the mocks (collision risk by construction).

### D41 — `negocio` fallback slug (implementation-time)
**Chosen:** when `slugify` yields `''` (a punctuation-only name), the base falls
back to `negocio` before collision suffixing.
**Why:** an empty slug is unreachable by URL and unlistable, while the name is
still valid per §9 — the business must get a reachable public profile.
**Rejected:** rejecting such names (no §9 rule against them), storing `''`
(orphaned business), rejecting at zod level (schema drift for one edge).

### D42 — Availability endpoint: two sequential store calls, up to ~1.2 s (implementation-time)
**Chosen:** the availability handler awaits `getBusinessBySlug` +
`listAppointments` (2 × 300–600 ms) and passes both results to pure
`generateSlots`.
**Why:** honoring "latency lives only in the store" beats special-casing one
endpoint; the wizard already designs for per-date skeletons (§13), so the extra
~600 ms is covered UX.
**Rejected:** skipping latency in `listAppointments` (breaks the
one-latency-source rule), a combined store method (API surface grows for a
single caller).

---

*Register maintained alongside AGENTS.md. Any deviation discovered during
implementation must be reported in the implementing agent's final summary and
recorded here — never applied silently.*
