'use client';

import { useEffect, type ReactNode } from 'react';

import { ErrorPanel } from '@/components/ui';

/**
 * Root error boundary (§13): Spanish copy + "Reintentar". Next.js 16 forwards
 * `retry()` — it re-fetches and re-renders the segment, which is what a
 * transient failure (e.g. a cold store) needs; the docs deprecate plain
 * `reset()` for this case.
 */
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}): ReactNode {
  useEffect(() => {
    // Log for console/debug tooling; `digest` lets production errors be
    // correlated with the server-side logs.
    console.error(error);
  }, [error]);

  return (
    // Renders inside the root layout, so the warm theme already applies.
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4">
      <div className="w-full">
        {/* Title "Algo salió mal" + this message = the exact §9 copy for
            unexpected failures. */}
        <ErrorPanel
          message="Inténtalo de nuevo en unos momentos."
          onRetry={retry}
        />
      </div>
    </div>
  );
}
