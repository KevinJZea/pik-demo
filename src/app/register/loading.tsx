import type { ReactNode } from 'react';

import { Card, Skeleton } from '@/components/ui';

/** Skeleton for the registration-success page (§6): shapes its final layout. */
export default function RegisterLoading(): ReactNode {
  return (
    <div className="mx-auto w-full max-w-md pt-6 pb-10" role="status">
      <span className="sr-only">Cargando…</span>
      <Card className="p-6 text-center">
        <div
          aria-hidden="true"
          className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sand"
        >
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
        <Skeleton className="mx-auto mt-4 h-7 w-56" />
        <Skeleton className="mx-auto mt-2 h-4 w-40" />
        <Skeleton className="mx-auto mt-5 h-6 w-48" />
        <Skeleton className="mx-auto mt-3 h-5 w-28 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-4 w-64" />
        <div className="mt-6 flex flex-col gap-2.5">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </Card>
    </div>
  );
}
