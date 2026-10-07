import Link from 'next/link';
import type { ReactNode } from 'react';

/** Spanish 404 (§13). Server component: links only, no client JS. */
export default function NotFound(): ReactNode {
  return (
    // Renders inside the root layout, so the warm theme already applies.
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <span
        aria-hidden="true"
        className="grid h-14 w-14 place-items-center rounded-full bg-sand text-taupe"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m16.2 16.2 3.8 3.8" />
          <path d="m9 9 4 4M13 9l-4 4" />
        </svg>
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold text-espresso">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-80 text-sm text-taupe">
        La página que buscas no existe o se movió de lugar.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-plum px-5 text-sm font-medium text-white transition-colors hover:bg-plum-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2 sm:w-auto sm:min-w-56"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
