import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui';

/** Home loading skeleton (§13): hero + directory card shapes. */
export default function HomeLoading(): ReactNode {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-12" role="status">
      <span className="sr-only">Cargando…</span>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>
      <div className="mt-10 sm:mt-14">
        <Skeleton className="h-9 w-72 max-w-full sm:h-10" />
        <Skeleton className="mt-3 h-4 w-64 max-w-full" />
      </div>
      <div className="mt-10">
        <Skeleton className="h-6 w-24" />
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((index) => (
            <li key={index} aria-hidden="true">
              <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
                <Skeleton className="h-28 w-full rounded-none" />
                <div className="p-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-2 h-5 w-28 rounded-full" />
                  <Skeleton className="mt-2 h-4 w-56" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
