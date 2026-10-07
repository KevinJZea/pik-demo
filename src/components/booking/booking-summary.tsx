'use client';

import { useState, type ReactNode, type SubmitEvent } from 'react';

import type { Service, Staff } from '@/types/domain';
import { cn } from '@/components/ui/cn';
import { Button, Field, Input } from '@/components/ui';
import { BookingRecap } from './booking-recap';

export type BookingSummaryProps = {
  service: Service;
  /** Resolved staff; undefined when the customer picked "Primero disponible". */
  staff?: Staff;
  date: string;
  startMin: number;
  /** Validation messages keyed by field, exact §9 copy supplied by the caller. */
  fieldErrors?: { customerName?: string; customerPhone?: string };
  /** True while the fake payment + POST run; disables the confirm button. */
  submitting?: boolean;
  onConfirm: (customerName: string, customerPhone: string) => void;
  className?: string;
};

export function BookingSummary({
  service,
  staff,
  date,
  startMin,
  fieldErrors,
  submitting = false,
  onConfirm,
  className,
}: BookingSummaryProps): ReactNode {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Trimmed so the zod checks in the caller see the intended values.
    onConfirm(customerName.trim(), customerPhone.trim());
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <BookingRecap
        service={service}
        staff={staff}
        date={date}
        startMin={startMin}
      />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field
          id="customer-name"
          label="Tu nombre"
          error={fieldErrors?.customerName}
        >
          {(aria) => (
            <Input
              {...aria}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              autoComplete="name"
            />
          )}
        </Field>
        <Field
          id="customer-phone"
          label="Tu teléfono"
          hint="7 a 15 dígitos."
          error={fieldErrors?.customerPhone}
        >
          {(aria) => (
            <Input
              {...aria}
              type="tel"
              inputMode="tel"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              autoComplete="tel"
            />
          )}
        </Field>
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Confirmar y pagar
        </Button>
      </form>
    </div>
  );
}
