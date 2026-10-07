import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui';

/** Profile loading skeleton (§13): cover, header, info cards, service grid. */
export default function ProfileLoading(): ReactNode {
  return (
    <div
      className="mx-auto w-full max-w-md px-4 pt-6 pb-12 sm:max-w-2xl"
      role="status"
    >
      <span className="sr-only">Cargando…</span>
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="p-5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-5 w-28 rounded-full" />
          <Skeleton className="mt-3 h-4 w-64" />
          <Skeleton className="mt-3 h-4 w-40" />
        </div>
      </div>
      {[0, 1].map((index) => (
        <div key={index} className="mt-6">
          <Skeleton className="h-5 w-24" />
          <div className="mt-3 rounded-2xl border border-line bg-card px-5 py-4">
            <div className="space-y-2.5" aria-hidden="true">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      ))}
      <div className="mt-6">
        <Skeleton className="h-5 w-24" />
        <ul
          aria-hidden="true"
          className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        >
          {[0, 1, 2, 3].map((row) => (
            <li
              key={row}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4"
            >
              <div>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="mt-1 h-3 w-28" />
              </div>
              <Skeleton className="h-11 w-24 rounded-xl" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
