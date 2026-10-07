'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { STEP_ROUTES, WizardProvider } from '@/components/register';
import { Stepper } from '@/components/ui';

// Short labels for the Stepper pills; headings per step live in the pages.
const STEP_LABELS = [
  'Negocio',
  'Ubicación',
  'Servicios',
  'Equipo',
  'Resumen',
] as const;

export default function RegisterLayout({
  children,
}: LayoutProps<'/register'>): ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const stepIndex = STEP_ROUTES.indexOf(
    pathname as (typeof STEP_ROUTES)[number],
  );
  // The success route is outside the 5 steps — the Stepper hides there.
  const showStepper = stepIndex >= 0;

  return (
    <WizardProvider>
      <div className="flex min-h-dvh flex-col">
        <header className="mx-auto w-full max-w-md px-4 pt-6 sm:max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl font-semibold text-espresso">
                PIK
              </p>
              <p className="text-sm text-taupe">Registra tu negocio</p>
            </div>
            {/* Exit hatch to Home: the draft lives in sessionStorage, so
                leaving and coming back restores it — the flow is never lost. */}
            <Link
              href="/"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-card px-3.5 text-sm font-medium text-espresso transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Inicio
            </Link>
          </div>
          {showStepper && (
            // Only completed steps are clickable inside Stepper (§13); a
            // click walks the draft back without losing state.
            <Stepper
              steps={STEP_LABELS}
              current={stepIndex}
              onStepClick={(index) => void router.push(STEP_ROUTES[index])}
              className="mt-5"
            />
          )}
        </header>
        {/* flex-col main lets each StepShell fill the height so its sticky
            CTA bar pins to the viewport bottom on short steps. */}
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-2 pt-4 sm:max-w-2xl">
          {children}
        </main>
      </div>
    </WizardProvider>
  );
}
