import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { CATEGORIES } from '@/lib/categories';
import { store } from '@/lib/store';
import { Badge, Card } from '@/components/ui';

// Link faces mirrored from Button variants; plain classes because Link can't
// be a Button and cn has no class-merge logic.
const PRIMARY_LINK =
  'inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-plum px-5 text-sm font-medium text-white transition-colors hover:bg-plum-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2';
const SECONDARY_LINK =
  'inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-card px-5 text-sm font-medium text-espresso transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2';

/**
 * Registration confirmation (§13). Server component reading the in-memory
 * store directly (§8): the created business was POSTed moments ago by the
 * summary step, identified here by its slug in the ?b= parameter.
 */
export default async function RegisterSuccessPage(
  props: PageProps<'/register/success'>,
): Promise<ReactNode> {
  const { b } = await props.searchParams;
  // Both a missing slug and an unknown one are plain 404s (§13).
  if (typeof b !== 'string' || b.length === 0) notFound();
  const business = await store.getBusinessBySlug(b);
  if (business === null) notFound();
  const category = CATEGORIES[business.category];

  return (
    <div className="mx-auto w-full max-w-md px-0 pt-6 pb-10">
      <Card className="p-6 text-center">
        <span
          aria-hidden="true"
          className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sage/15 text-sage"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12 2.5 2.5 4.5-5" />
          </svg>
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold text-espresso">
          ¡Tu negocio está listo!
        </h1>
        <p className="mt-2 text-sm text-taupe">
          Ya puedes recibir reservas en línea.
        </p>
        <p className="mt-5 font-display text-xl font-semibold text-espresso">
          {business.name}
        </p>
        <Badge tone="plum" className="mt-2">
          {category.label}
        </Badge>
        <p className="mt-5 text-sm text-taupe">
          Comparte el perfil público con tus clientes para que aparten su cita.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link href={`/b/${business.slug}`} className={PRIMARY_LINK}>
            Ver perfil público
          </Link>
          <Link href="/" className={SECONDARY_LINK}>
            Ir al inicio
          </Link>
        </div>
      </Card>
    </div>
  );
}
