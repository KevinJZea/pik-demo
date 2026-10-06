'use client';

import type { ReactNode } from 'react';

import { cn } from './cn';

export type StepperProps = {
  /** Short labels for each step, in order (Spanish copy from the caller). */
  steps: readonly string[];
  /** Zero-based index of the current step. */
  current: number;
  /**
   * Clicking a completed step (index < current) navigates back; only
   * completed steps are clickable — jumping ahead is disallowed (§13).
   */
  onStepClick?: (index: number) => void;
  className?: string;
};

export function Stepper({
  steps,
  current,
  onStepClick,
  className,
}: StepperProps): ReactNode {
  return (
    <ol
      aria-label="Progreso"
      className={cn('flex items-center gap-1.5', className)}
    >
      {steps.map((label, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;
        const circle = (
          <span
            aria-hidden="true"
            className={cn(
              'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold',
              isCompleted || isCurrent
                ? 'bg-plum text-white'
                : 'bg-sand text-taupe',
              isCurrent && 'ring-2 ring-plum ring-offset-2',
            )}
          >
            {index + 1}
          </span>
        );
        return (
          <li
            key={label}
            // aria-current marks the current step for screen readers.
            aria-current={isCurrent ? 'step' : undefined}
            className="flex min-w-0 items-center gap-1.5"
          >
            {isCompleted && onStepClick ? (
              // 44px+ min hit target for the touch baseline.
              <button
                type="button"
                onClick={() => onStepClick(index)}
                title={label}
                className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
              >
                {circle}
              </button>
            ) : (
              <span className="grid shrink-0 place-items-center">{circle}</span>
            )}
            <span
              aria-hidden="true"
              className="hidden text-sm text-espresso sm:inline"
            >
              {isCurrent ? (
                <span className="font-semibold">{label}</span>
              ) : isCompleted ? (
                label
              ) : (
                <span className="text-taupe">{label}</span>
              )}
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'h-px min-w-2 flex-1',
                  isCompleted ? 'bg-plum' : 'bg-line',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
