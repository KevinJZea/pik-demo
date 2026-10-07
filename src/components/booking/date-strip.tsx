'use client';

import type { ReactNode } from 'react';

import type { WeeklyHours } from '@/types/domain';
import { MONTH_SHORT, WEEKDAY_SHORT, formatDate } from '@/lib/format';
import { bookingWindow, dayOfWeek, isClosedOn } from './dates';
import { cn } from '@/components/ui/cn';

export type DateStripProps = {
  hours: WeeklyHours;
  /** Selected date ("YYYY-MM-DD") from the URL, when set. */
  selected?: string;
  onSelect: (date: string) => void;
  className?: string;
};

export function DateStrip({
  hours,
  selected,
  onSelect,
  className,
}: DateStripProps): ReactNode {
  const dates = bookingWindow();
  return (
    // Horizontal scroll keeps the 14 cells reachable on mobile; the parent
    // page constrains the width so the scroll happens inside this strip.
    <div className={cn('overflow-x-auto pb-1', className)}>
      <ul className="flex w-max gap-1.5">
        {dates.map((date, index) => {
          const closed = isClosedOn(hours, date);
          const isToday = index === 0;
          // Mini label under the day number: "Cerrado" and "Hoy" win over the
          // month name, which only shows when the strip crosses a month.
          const monthChanged =
            index > 0 && dates[index - 1].slice(5, 7) !== date.slice(5, 7);
          const mini = closed
            ? 'Cerrado'
            : isToday
              ? 'Hoy'
              : monthChanged
                ? MONTH_SHORT[Number(date.slice(5, 7)) - 1]
                : '';
          const label = closed
            ? `${formatDate(date)}, cerrado`
            : isToday
              ? `${formatDate(date)}, hoy`
              : formatDate(date);
          return (
            <li key={date}>
              <button
                type="button"
                disabled={closed}
                aria-pressed={date === selected}
                aria-label={label}
                onClick={() => onSelect(date)}
                className={cn(
                  'flex w-12 shrink-0 flex-col items-center gap-1 rounded-xl border px-1 pb-2 pt-2.5 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2',
                  date === selected
                    ? 'border-plum bg-plum text-white'
                    : 'border-line bg-card text-espresso hover:bg-sand',
                  closed && 'border-transparent bg-transparent text-taupe/70',
                )}
              >
                <span className="text-[11px] leading-none">
                  {WEEKDAY_SHORT[dayOfWeek(date)]}
                </span>
                <span className="font-display text-lg leading-none">
                  {Number(date.slice(8, 10))}
                </span>
                {/* Fixed-height slot keeps all cells aligned when mini is empty. */}
                <span className="min-h-2.5 text-[10px] leading-none">
                  {mini}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
