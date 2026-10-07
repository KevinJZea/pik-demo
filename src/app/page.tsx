import Link from 'next/link';
import { connection } from 'next/server';
import type { ReactNode } from 'react';

import { BusinessCard } from '@/components/home';
import { store } from '@/lib/store';
import { EmptyState } from '@/components/ui';

/**
 * Home (§1.3): directory of businesses that links to the public profiles and
 * to the registration wizard. Server component reading the in-memory store
 * directly (§8) — zero client JS.
 */
export default async function HomePage(): Promise<ReactNode> {
  // The store mutates at runtime (new registrations via POST /api/businesses),
  // and without request-time APIs Next would statically prerender this page at
  // build time — freezing the directory with the 4 seeds forever. connection()
  // opts into per-request rendering (16.x API for mutable non-request-API data).
  await connection();
  const businesses = await store.getBusinesses();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-12">
      <header className="flex items-center justify-between gap-4">
        <p className="font-display text-xl font-semibold tracking-tight text-plum">
          PIK
        </p>
        <Link
          href="/register"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-espresso transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
        >
          Registra tu negocio
        </Link>
      </header>

      <section className="mt-10 sm:mt-14">
        <h1 className="max-w-2xl font-display text-3xl font-semibold text-espresso sm:text-4xl">
          Aparta tu cita y paga en línea
        </h1>
        <p className="mt-3 max-w-xl text-sm text-taupe sm:text-base">
          Salones, barberías, spas y estudios de uñas cerca de ti. Elige tu
          servicio, tu especialista y tu horario en minutos.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-espresso">
          Negocios
        </h2>
        {businesses.length === 0 ? (
          // Defensive: seeds guarantee content, but the demo must degrade well.
          <EmptyState
            className="mt-4"
            title="Aún no hay negocios registrados"
            body="Vuelve pronto: aquí verás los negocios disponibles para reservar."
          />
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <li key={business.id}>
                <BusinessCard business={business} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
