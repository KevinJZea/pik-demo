'use client';

import type { ReactNode } from 'react';

import type { Service, Staff } from '@/types/domain';
import { Badge, Button, EmptyState } from '@/components/ui';
import { cn } from '@/components/ui/cn';

export type StaffPickerProps = {
  service: Service;
  /** The business's full staff list; eligibility is filtered internally. */
  staff: Staff[];
  /** All services, for rendering the assigned-service chips. */
  services: Service[];
  /** Current staff URL param: 'any', a staff id, or unset. */
  selectedStaff?: string;
  onSelect: (staffId: string) => void;
  /** Back CTA for the empty state (no staff provides the service). */
  onBackToServices: () => void;
  className?: string;
};

export function StaffPicker({
  service,
  staff,
  services,
  selectedStaff,
  onSelect,
  onBackToServices,
  className,
}: StaffPickerProps): ReactNode {
  // Eligibility mirrors the server-side rule (§10): only staff whose
  // serviceIds include the chosen service may be booked for it.
  const eligible = staff.filter((member) =>
    member.serviceIds.includes(service.id),
  );

  if (eligible.length === 0) {
    return (
      <EmptyState
        title="Nadie ofrece este servicio por ahora."
        body="Prueba con otro servicio del catálogo."
        action={
          <Button variant="secondary" onClick={onBackToServices}>
            Elegir otro servicio
          </Button>
        }
        className={className}
      />
    );
  }

  const serviceNameOf = (id: string): string =>
    services.find((candidate) => candidate.id === id)?.name ?? '';

  const cardClasses = (selected: boolean): string =>
    cn(
      'flex h-full w-full min-h-11 flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2',
      selected ? 'border-plum bg-plum/10' : 'border-line bg-card hover:bg-sand',
    );

  return (
    <ul className={cn('grid gap-3 sm:grid-cols-2', className)}>
      <li>
        <button
          type="button"
          aria-pressed={selectedStaff === 'any'}
          onClick={() => onSelect('any')}
          className={cardClasses(selectedStaff === 'any')}
        >
          <span className="font-medium text-espresso">Primero disponible</span>
          <span className="text-sm text-taupe">
            Reserva con la primera persona libre a la hora que elijas.
          </span>
        </button>
      </li>
      {eligible.map((member) => {
        const selected = member.id === selectedStaff;
        return (
          <li key={member.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(member.id)}
              className={cardClasses(selected)}
            >
              <span className="font-medium text-espresso">{member.name}</span>
              <span className="text-sm text-taupe">{member.role}</span>
              <span className="mt-1 flex flex-wrap gap-1">
                {member.serviceIds.map((serviceId) => (
                  <Badge key={serviceId} tone="neutral">
                    {serviceNameOf(serviceId)}
                  </Badge>
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
