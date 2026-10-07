'use client';

import type { ReactNode } from 'react';

import type { TimeSlot } from '@/types/domain';
import { formatTime } from '@/lib/format';
import { Skeleton } from '@/components/ui';
import { cn } from '@/components/ui/cn';

export type SlotGridProps = {
  /** null = availability for this date is still loading. */
  slots: TimeSlot[] | null;
  /** True when the selected date falls on a closed day. */
  closed?: boolean;
  /** Selected slot start (minutes from midnight) from the URL, when set. */
  selected?: number;
  onSelect: (startMin: number) => void;
  className?: string;
};

const NOTICES =
  'rounded-2xl border border-line bg-card px-4 py-3.5 text-center text-sm text-taupe';

export function SlotGrid({
  slots,
  closed = false,
  selected,
  onSelect,
  className,
}: SlotGridProps): ReactNode {
  if (closed) {
    return (
      <p className={NOTICES}>
        El negocio está cerrado este día. Prueba otra fecha.
      </p>
    );
  }

  if (slots === null) {
    return (
      <div
        className={cn(
          'grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6',
          className,
        )}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className="h-11 rounded-full" />
        ))}
      </div>
    );
  }

  // Special case (states matrix §13): a day where every candidate slot is
  // taken shows the "no horarios" notice instead of a wall of disabled pills.
  const anyAvailable = slots.some((slot) => slot.available);
  if (slots.length === 0 || !anyAvailable) {
    return (
      <p className={NOTICES}>
        No hay horarios disponibles este día. Prueba otra fecha.
      </p>
    );
  }

  return (
    <ul
      className={cn(
        'grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6',
        className,
      )}
    >
      {slots.map((slot) => {
        const isSelected = slot.available && slot.startMin === selected;
        return (
          <li key={slot.startMin}>
            <button
              type="button"
              disabled={!slot.available}
              aria-pressed={isSelected}
              onClick={() => onSelect(slot.startMin)}
              className={cn(
                'w-full min-h-11 rounded-full border px-2 text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2',
                isSelected
                  ? 'border-plum bg-plum text-white'
                  : slot.available
                    ? 'border-line bg-card text-espresso hover:bg-sand'
                    : // Busy slot: disabled + muted, but the time stays readable
                      // so the unavailability is visible, not color-only.
                      'cursor-not-allowed border-transparent bg-sand text-taupe/70',
              )}
            >
              {formatTime(slot.startMin)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
