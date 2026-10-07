'use client';

import type { ReactNode } from 'react';

import type { Appointment, Business } from '@/types/domain';
import { cn } from '@/components/ui/cn';
import { Button } from '@/components/ui';
import { BookingRecap } from './booking-recap';

export type BookingSuccessProps = {
  business: Business;
  /** The 201 response, with staffId already resolved server-side. */
  appointment: Appointment;
  /** "Hecho" — back to the business profile. */
  onDone: () => void;
  className?: string;
};

export function BookingSuccess({
  business,
  appointment,
  onDone,
  className,
}: BookingSuccessProps): ReactNode {
  const service = business.services.find(
    (candidate) => candidate.id === appointment.serviceId,
  );
  const staff = business.staff.find(
    (candidate) => candidate.id === appointment.staffId,
  );
  if (!service) {
    // Defensive: the API echoed an unknown service — the wizard can't render
    // a recap, so fall back to the minimal confirmation.
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-4 text-center',
          className,
        )}
      >
        <h2 className="font-display text-2xl text-espresso">
          ¡Reserva confirmada!
        </h2>
        <p className="font-display text-3xl tracking-wide text-espresso">
          {appointment.reference}
        </p>
        <Button onClick={onDone} className="w-full">
          Hecho
        </Button>
      </div>
    );
  }
  return (
    <div
      className={cn('flex flex-col items-center gap-5 text-center', className)}
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-sage/15 text-[#3F5A3D]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="m5 13 4 4 10-10" />
        </svg>
      </div>
      <h2 className="font-display text-2xl text-espresso">
        ¡Reserva confirmada!
      </h2>
      <div className="w-full rounded-2xl bg-sand px-4 py-4">
        <p className="text-xs font-medium text-taupe">Código de confirmación</p>
        <p className="mt-1 font-display text-3xl tracking-wide text-espresso">
          {appointment.reference}
        </p>
        <p className="mt-1 text-xs text-taupe">Pago simulado para la demo.</p>
      </div>
      {staff && (
        <BookingRecap
          service={service}
          staff={staff}
          date={appointment.date}
          startMin={appointment.startMin}
          customer={{
            name: appointment.customerName,
            phone: appointment.customerPhone,
          }}
          className="w-full"
        />
      )}
      <Button onClick={onDone} className="w-full">
        Hecho
      </Button>
    </div>
  );
}
