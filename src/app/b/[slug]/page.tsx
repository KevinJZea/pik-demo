import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { CATEGORIES, gradientBackground } from '@/lib/categories';
import {
  WEEKDAY_NAMES,
  WEEKDAYS_MONDAY_FIRST,
  formatDayHours,
  formatDuration,
  formatPrice,
} from '@/lib/format';
import { store } from '@/lib/store';
import { Badge, Card } from '@/components/ui';

/**
 * Business profile (§13). Pure server component: reads the store directly,
 * renders information + service cards as plain links to the booking wizard —
 * zero client JS on this page. Unknown slug → 404 via notFound().
 */
export default async function BusinessProfilePage(
  props: PageProps<'/b/[slug]'>,
): Promise<ReactNode> {
  const { slug } = await props.params;
  const business = await store.getBusinessBySlug(slug);
  if (business === null) notFound();
  const category = CATEGORIES[business.category];
  const Glyph = category.glyph;

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-6 pb-12 sm:max-w-2xl">
      <Card className="overflow-hidden p-0">
        <div
          aria-hidden="true"
          className="grid h-40 place-items-center text-white"
          style={{ background: gradientBackground(category.gradient) }}
        >
          <Glyph className="h-16 w-16" />
        </div>
        <div className="p-5">
          <h1 className="font-display text-2xl font-semibold text-espresso">
            {business.name}
          </h1>
          <Badge tone="terracotta" className="mt-2">
            {category.label}
          </Badge>
          <p className="mt-3 text-sm text-taupe">
            {business.address}, {business.city}
          </p>
          {/* Plain <a>: tel: hrefs are outside the typed-route system. */}
          <a
            href={`tel:${business.phone}`}
            className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-plum hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
          >
            Tel. {business.phone}
          </a>
        </div>
      </Card>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-espresso">
          Horario
        </h2>
        <Card className="mt-3 px-5 py-4">
          <ul className="space-y-1.5">
            {WEEKDAYS_MONDAY_FIRST.map((day) => {
              const hours = business.hours[day];
              return (
                <li
                  key={day}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-espresso">{WEEKDAY_NAMES[day]}</span>
                  {hours === null ? (
                    <span className="text-taupe">Cerrado</span>
                  ) : (
                    <span className="text-espresso">
                      {formatDayHours(hours)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-espresso">
          Equipo
        </h2>
        <Card className="mt-3 px-5 py-4">
          <ul className="space-y-2">
            {business.staff.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="font-medium text-espresso">{member.name}</span>
                <span className="text-taupe">{member.role}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-espresso">
          Servicios
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {business.services.map((service) => (
            <li key={service.id}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-espresso">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-xs text-taupe">
                    {formatDuration(service.durationMin)} ·{' '}
                    {formatPrice(service.priceCents)}
                  </p>
                </div>
                {/* Booking route lands in step F9; cast per the typed-routes
                    guide (non-literal href to a dynamic route). */}
                <Link
                  href={`/b/${business.slug}/book?service=${service.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-plum px-4 text-sm font-medium text-white transition-colors hover:bg-plum-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
                >
                  Reservar
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
