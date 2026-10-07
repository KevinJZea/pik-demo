'use client';

import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui';

/**
 * Booking wizard loading skeleton: Suspense fallback for useSearchParams plus
 * the in-wizard business-fetch state — shapes the final wizard layout.
 */
export function BookingLoading(): ReactNode {
  return (
    <div
      className="mx-auto w-full max-w-md px-4 pt-6 pb-12"
      role="status"
      aria-label="Cargando"
    >
      <Skeleton className="h-6 w-48" />
      <div className="mt-6 flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex min-w-0 flex-1 items-center gap-1.5">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <Skeleton className="h-px min-w-2 flex-1" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-6 w-40" />
      <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <li
            key={index}
            className="flex min-h-11 flex-col items-start gap-1 rounded-2xl border border-line bg-card p-4"
          >
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-28" />
          </li>
        ))}
      </ul>
    </div>
  );
}
