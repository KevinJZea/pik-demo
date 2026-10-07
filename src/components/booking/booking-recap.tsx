'use client';

import type { ReactNode } from 'react';

import type { Service, Staff } from '@/types/domain';
import {
  formatDate,
  formatDuration,
  formatPrice,
  formatTime,
} from '@/lib/format';
import { Card } from '@/components/ui';
import { cn } from '@/components/ui/cn';

export type BookingRecapProps = {
  service: Service;
  /** Resolved staff; undefined renders the "Primero disponible" line. */
  staff?: Staff;
  date: string;
  startMin: number;
  /** Customer info — shown once the appointment exists (success screen). */
  customer?: { name: string; phone: string };
  className?: string;
};

function Row({ label, value }: { label: string; value: ReactNode }): ReactNode {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-2.5 first:border-t-0 first:pt-0">
      <dt className="shrink-0 text-sm text-taupe">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-espresso">{value}</dd>
    </div>
  );
}

export function BookingRecap({
  service,
  staff,
  date,
  startMin,
  customer,
  className,
}: BookingRecapProps): ReactNode {
  return (
    <Card className={cn('px-4 py-3', className)}>
      <dl>
        <Row
          label="Servicio"
          value={`${service.name} · ${formatDuration(service.durationMin)}`}
        />
        <Row
          label="Especialista"
          value={staff ? `${staff.name} · ${staff.role}` : 'Primero disponible'}
        />
        <Row label="Fecha" value={formatDate(date)} />
        <Row label="Hora" value={formatTime(startMin)} />
        <Row
          label="Total"
          value={
            <span className="font-semibold">
              {formatPrice(service.priceCents)}
            </span>
          }
        />
        {customer && (
          <>
            <Row label="A nombre de" value={customer.name} />
            <Row label="Teléfono" value={customer.phone} />
          </>
        )}
      </dl>
    </Card>
  );
}
