# PIK — Booking & payments for beauty & wellness (MVP demo)

PIK is a booking-and-payment marketplace for salons, barbershops, spas, and nail
studios. This repository is the **MVP demo**: two user flows, mocked data, no
database, no authentication, no real payments. Product copy is in Spanish
(Mexico City vibe); prices are in MXN.

| Flow | Where | What it does |
|---|---|---|
| Business registration | `/register` | 5-step wizard: details → location & weekly hours → services → staff + service assignment → summary & confirm |
| Appointment booking | `/b/[slug]` | Business profile (server-rendered, links only) → booking wizard: service → staff ("Primero disponible" allowed) → date & time slot → confirm & pay (simulated) |
| Home | `/` | Directory of the four seeded businesses + "Registra tu negocio" CTA |

Everything in this README describes the app as specified in [`AGENTS.md`](./AGENTS.md)
(the single source of truth for this repository) and [`DECISIONS.md`](./DECISIONS.md)
(the rationale register: what was chosen, why, and what was rejected).

---

## 1. How to run the project

Prerequisites: **Node.js 20+** and **pnpm 11** (`corepack enable` if you don't have it).

```bash
pnpm install          # install dependencies
pnpm dev              # dev server (Turbopack) on http://localhost:3000
pnpm build            # production build
pnpm start            # serve the production build
pnpm lint             # ESLint 9 (flat config) — there is no `next lint`
pnpm exec tsc --noEmit   # typecheck only
```

### How the mocked data behaves

- **Seeded businesses:** four businesses (one per category), each with services, staff,
  weekly hours, and pre-seeded appointments generated **relative to today**, so
  unavailable slots always look real.
- **Simulated latency:** every read through the in-memory store sleeps 300–600 ms on
  purpose, so loading skeletons and spinners are actually observable.
- **`?fail=1` demo flag:** append `?fail=1` to any API route
  (e.g. `/api/businesses/barberia-don-rafa?fail=1`) to get a deterministic
  `500` with a Spanish error message — the reliable way to demo error states
  (error panels, retries, the 409 recovery flow).
- **In-memory store:** no database. Data resets when the server restarts, and on
  Vercel each serverless instance has its own copy — a business you register may
  404 minutes later on a cold instance. Seeded businesses exist everywhere.
  `pnpm dev` is a single instance, so the full loop (register → book your own
  business) works reliably there.
- Booking the same slot from two tabs: the second confirm gets a `409`
  ("Ese horario acaba de ocuparse") and the wizard sends you back to the time step
  with fresh slots.

---

## 2. How the folders are organized — and why

```
src/
  app/                        # App Router: every route is a folder; this is the UX map
    api/                      #   Backend: the 4 Route Handlers (businesses, availability, appointments)
    register/                 #   Frontend: the 5-step wizard (one URL per step + success page)
    b/[slug]/                  #   Frontend: business profile (RSC) + /book wizard (client)
    layout.tsx, page.tsx,     #   Frontend: root layout, home directory, loading/error/not-found
    loading.tsx, error.tsx, not-found.tsx, globals.css
  components/
    ui/                       #   Design-system primitives (Button, Field, Stepper, Skeleton…)
    home/ register/ booking/  #   Feature components, grouped by the flow they serve
  lib/
    store.ts                  #   Backend: in-memory store (server-only), loads seeds once
    availability.ts           #   Backend: pure slot-generation algorithm
    schemas.ts                #   Backend-owned, shared: zod schemas + Spanish messages
    slug.ts, api-utils.ts     #   Backend: slugify, latency/fail helpers
    api.ts                    #   Frontend: typed fetch wrappers for the 4 endpoints
    format.ts, categories.ts #   Frontend: es-MX display helpers, category labels/glyphs
  types/domain.ts             # THE shared data contract (Business, Service, Staff, Appointment, TimeSlot)
  mocks/                      # Seed data (businesses + relative-to-today appointments)
```

Why it's shaped this way:

- **Routes mirror the product.** The folder tree under `app/` reads like the site map:
  `register/` has one folder per wizard step (URL-per-step), `b/[slug]/` is the public
  profile with a `book/` child for the wizard. Anyone can infer the UX from the tree.
- **Server/client boundary is explicit and consistent.** Server components (home,
  profile, registration success) read the store directly, like a data layer. Client
  components (both wizards) only reach data through the four Route Handlers via
  `fetch` — which is what gives them real loading, error, and success states.
  `import 'server-only'` physically prevents store code from leaking into the bundle.
- **`components/` splits primitives from features.** `ui/` is a tiny in-repo design
  system; `home/`, `register/`, `booking/` own their flow's composite components.
  No third-party component library.
- **`lib/` is split by owner, not by pattern.** Backend files (store, availability,
  schemas, slug) never import React; frontend files (api, format, categories) are
  browser-safe. The interesting file — `schemas.ts` — is Backend-owned but imported
  read-only by the frontend, so client forms and Route Handlers validate with the
  exact same rules and Spanish messages.
- **`types/domain.ts` is the contract.** One file defines every shape that crosses
  the server/client boundary. Both "agents" (see §4) build against it.
- **`mocks/` is only ever imported by the store.** No view touches seed data
  directly — everything flows through the store (RSC) or the API (client), which is
  what keeps swapping in a real database later mechanical.

---

## 3. Main UI/UX decisions

- **Spanish-first product, English code.** All user-visible copy is Spanish, inline
  (no i18n framework for the MVP); identifiers, docs, and comments are English.
  Prices are MXN stored as integer cents, rendered with `Intl` (`$350.00`).
- **Mobile-first, thumb-friendly.** Wizards are `max-w-md` with a sticky bottom CTA
  (safe-area padded), primary buttons full-width, ≥44 px hit targets, 3–4 slot
  buttons per row on phones (6–8 on desktop). Everything scales up from `sm`.
- **URL-driven wizards.** Registration steps are real URLs (`/register/services`,
  …); the booking wizard keeps `service`, `staff`, `date`, `time` in search params.
  Both flows are deep-linkable, survive refresh, and the browser back button behaves
  the way people expect.
- **Draft safety.** The registration draft persists to `sessionStorage`
  (`pik-registration-draft`) on every change and restores on mount — refreshing
  mid-wizard loses nothing; it's cleared only after a successful submit.
- **Honest availability.** Unavailable slots are rendered but disabled (never color
  alone), closed days are disabled in the date strip, past times are not returned,
  a fully-booked day shows a friendly empty state, and "Primero disponible" resolves
  server-side to the first free staff member.
- **Validated like a real product.** One zod schema set shared by client forms and
  Route Handlers; validation messages are exact Spanish product copy; field errors
  appear on blur/change but only after a first submit attempt (no nagging).
  The server re-runs every domain check at confirm time.
- **Designed states for every async surface.** Loading skeletons (home, profile,
  per-date slot fetch), empty states (first service, first staff member, fully-booked
  day, service with no staff), error states (`?fail=1`, 409 conflict recovery,
  404 pages), and success states (booking reference `PIK-XXXXXX`, registration
  confirmation linking to your new public profile).
- **Warm & elegant visual system.** Cream/sand/espresso neutrals with a deep plum
  accent (terracotta and sage in support), Fraunces for display type and Instrument
  Sans for UI — both self-hosted at build time via `next/font`. Business covers are
  CSS gradients + inline SVG glyphs per category: zero external images, zero
  runtime external services.
- **Accessibility baseline.** Real `<label>`s everywhere, errors wired with
  `aria-describedby` + `aria-invalid`, focus moved to the step heading on step
  changes, disabled `<button>`s for slots, contrast ≥ AA on the verified pairs.

---

## 4. What was done with AI assistance

- **Planning & decisions.** The whole architecture was settled in an AI-assisted
  Q&A with the owner before any code existed: 11 decision points (language/currency,
  mock-data strategy, mutations via Route Handlers vs Server Actions, wizard routing,
  booking flow shape, payment simulation, dependencies, design direction, …) plus a
  set of proposed defaults (slot rules, 14-day window, latency, fail flag) that the
  owner approved or vetoed.
- **Contracts first.** An AI assistant (opencode, GLM-5.3) authored
  [`AGENTS.md`](./AGENTS.md) — the single source of truth (data model, API contract,
  validation table with exact Spanish copy, slot algorithm, states matrix, seed
  requirements) — plus this README and [`DECISIONS.md`](./DECISIONS.md).
- **Parallel implementation.** Two AI agents implemented the app simultaneously
  against AGENTS.md without talking to each other: one Backend agent (types, schemas,
  store, availability algorithm, seeds, Route Handlers) and one Frontend agent
  (design tokens, primitives, wizards, pages). File ownership in AGENTS.md kept
  them out of each other's territory.
- **The human role.** Product owner: set the constraints, answered every open
  question, approved the plan, and reviewed the result. All product decisions and
  every tradeoff in DECISIONS.md were ratified (or made) by the human.
- **Not done by AI alone:** no tests exist (out of scope by decision); verification
  is `pnpm lint` + `pnpm exec tsc --noEmit` + `pnpm build` plus the manual QA script
  in AGENTS.md §14.

---

## 5. What would be great for a v2 (post-MVP)

1. **A real database + auth** (the #1 limitation): persistence for businesses and
   appointments, owner accounts with email login, per-business dashboards. The
   in-memory store is per-instance and resets — fine for a demo, not for production.
2. **Real payments** (e.g. Stripe) with refunds, tips, and payment links — replacing
   the simulated ~1.2 s "Confirmar y pagar".
3. **Timezone-aware booking** — today dates are naive local strings; server and
   client can disagree near midnight, and businesses need per-location time zones.
4. **Email/SMS confirmations & reminders** (Resend/Twilio) with ICS attachments —
   today the success screen with the `PIK-XXXXXX` reference is all you get.
5. **Reviews & ratings, search/filters, and a category map view** for the directory.
6. **Multi-service cart** (book a cut + a beard trim in one checkout) and recurring
   appointments.
7. **Admin dashboard for owners:** edit business info/hours/services/staff after
   registration (the MVP is write-once), no-show tracking, availability analytics.
8. **An i18n framework** — Spanish strings are inline by design; a second locale
   would need `next-intl` or similar.
9. **Partial prerendering / cache components** for the directory and profiles
   (currently fully dynamic), plus proper **tests and CI** (unit tests for the slot
   algorithm first — it's pure and perfect for it).

---

*Deployed on Vercel. Built with Next.js 16 (App Router, Turbopack, typed routes,
React Compiler), React 19, Tailwind CSS 4, and zod — no other runtime dependencies.*
