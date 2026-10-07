'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { Skeleton } from '@/components/ui';

export type StepShellProps = {
  /** 1-based step number for the "Paso N de 5" microcopy. */
  step: number;
  heading: string;
  description?: string;
  /**
   * Content of the sticky bottom CTA bar (usually a full-width primary
   * Button). Rendered as the last, always-visible element of the step.
   */
  cta: ReactNode;
  children: ReactNode;
};

export function StepShell({
  step,
  heading,
  description,
  cta,
  children,
}: StepShellProps): ReactNode {
  // Step changes move focus to the step heading (§13 accessibility baseline):
  // every step page mounts fresh, so this effect covers each URL transition.
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    // flex + flex-1 chain (main is flex-col too) keeps the sticky bar pinned
    // to the viewport bottom even while the step has little content.
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-taupe">
          Paso {step} de 5
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 font-display text-2xl font-semibold text-espresso focus:outline-none"
        >
          {heading}
        </h1>
        {description !== undefined && (
          <p className="mt-1.5 text-sm text-taupe">{description}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
      <div className="sticky bottom-0 z-10 mt-6 border-t border-line bg-cream/95 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-sm">
        <div className="flex justify-center sm:justify-end">{cta}</div>
      </div>
    </div>
  );
}

/** Shown while the draft hydrates from sessionStorage (or guards redirect). */
export function StepSkeleton(): ReactNode {
  return (
    <div role="status" aria-label="Cargando" className="mt-6 space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}
