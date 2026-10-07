'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { CATEGORIES } from '@/lib/categories';
import { formatDuration, formatPrice, formatWeeklyHours } from '@/lib/format';
import { Badge, Card } from '@/components/ui';
import type { WizardDraft } from './wizard-state';
import { STEP_ROUTES } from './wizard-state';

// Same face as Button variant="secondary"; a plain class string because Link
// can't use the Button element and cn has no class-merge logic.
const EDIT_LINK =
  'shrink-0 rounded text-sm font-medium text-plum underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2';

function GroupHeader({
  title,
  editHref,
}: {
  title: string;
  editHref: string;
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-base font-semibold text-espresso">
        {title}
      </h2>
      <Link href={editHref} className={EDIT_LINK}>
        Editar
      </Link>
    </div>
  );
}

export type SummaryGroupsProps = {
  draft: WizardDraft;
};

/** The 5th step's grouped review, one "Editar" link back per group (§13). */
export function SummaryGroups({ draft }: SummaryGroupsProps): ReactNode {
  const category = draft.category !== null ? CATEGORIES[draft.category] : null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-4">
        <GroupHeader title="Detalles" editHref={STEP_ROUTES[0]} />
        <p className="mt-3 font-medium text-espresso">
          {draft.name !== '' ? draft.name : '—'}
        </p>
        {category !== null && (
          <Badge tone="plum" className="mt-1.5">
            {category.label}
          </Badge>
        )}
        <p className="mt-3 text-sm">
          <span className="block text-xs text-taupe">Teléfono</span>
          {draft.phone !== '' ? draft.phone : '—'}
        </p>
      </Card>

      <Card className="p-4">
        <GroupHeader title="Ubicación y horario" editHref={STEP_ROUTES[1]} />
        <p className="mt-3 text-sm">
          <span className="block text-xs text-taupe">Dirección</span>
          {draft.address !== '' ? draft.address : '—'}
          <span className="block">{draft.city !== '' ? draft.city : '—'}</span>
        </p>
        <p className="mt-3 text-sm">
          <span className="block text-xs text-taupe">Horario semanal</span>
        </p>
        <ul className="mt-1 space-y-0.5 text-sm text-taupe">
          {formatWeeklyHours(draft.hours).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <GroupHeader title="Servicios" editHref={STEP_ROUTES[2]} />
        {draft.services.length === 0 ? (
          <p className="mt-3 text-sm text-taupe">Sin servicios por ahora.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {draft.services.map((service) => (
              <li
                key={service.id}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="min-w-0 truncate font-medium text-espresso">
                  {service.name}
                </span>
                <span className="shrink-0 text-taupe">
                  {formatDuration(service.durationMin)} ·{' '}
                  {formatPrice(service.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <GroupHeader title="Equipo" editHref={STEP_ROUTES[3]} />
        {draft.staff.length === 0 ? (
          <p className="mt-3 text-sm text-taupe">Sin integrantes por ahora.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {draft.staff.map((member) => (
              <li key={member.id}>
                <p className="font-medium text-espresso">
                  {member.name}
                  <span className="ml-1.5 text-xs text-taupe">
                    {member.role}
                  </span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {member.serviceIds.map((serviceId) => {
                    const service = draft.services.find(
                      (item) => item.id === serviceId,
                    );
                    if (service === undefined) return null;
                    return (
                      <span
                        key={serviceId}
                        className="rounded-full bg-terracotta/15 px-2 py-0.5 text-xs font-medium text-[#7A4524]"
                      >
                        {service.name}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
