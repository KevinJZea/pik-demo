'use client';

import type { ReactNode } from 'react';

import type { Service } from '@/types/domain';
import { formatDuration, formatPrice } from '@/lib/format';
import { cn } from '@/components/ui/cn';

export type ServicePickerProps = {
  services: Service[];
  /** Currently chosen service id (URL param), for the selected state. */
  selectedId?: string;
  onSelect: (serviceId: string) => void;
  className?: string;
};

export function ServicePicker({
  services,
  selectedId,
  onSelect,
  className,
}: ServicePickerProps): ReactNode {
  return (
    <ul className={cn('grid gap-3 sm:grid-cols-2', className)}>
      {services.map((service) => {
        const selected = service.id === selectedId;
        return (
          <li key={service.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(service.id)}
              className={cn(
                'flex w-full min-h-11 flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2',
                selected
                  ? 'border-plum bg-plum/10'
                  : 'border-line bg-card hover:bg-sand',
              )}
            >
              <span className="font-medium text-espresso">{service.name}</span>
              <span className="text-sm text-taupe">
                {formatDuration(service.durationMin)}
                {' · '}
                <span className="font-medium text-espresso">
                  {formatPrice(service.priceCents)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
