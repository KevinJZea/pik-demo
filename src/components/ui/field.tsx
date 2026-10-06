'use client';

import type { ReactNode } from 'react';

import { cn } from './cn';

export type FieldProps = {
  /** id of the control; hint/error ids derive from it: `${id}-hint`, `${id}-error`. */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  /**
   * Render-prop: receives the wiring props to spread onto the control
   * (Input/Select), so `aria-describedby`/`aria-invalid` can never drift
   * from the rendered hint/error messages.
   */
  children: (aria: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
  }) => ReactNode;
};

export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: FieldProps): ReactNode {
  const hintId = hint !== undefined ? `${id}-hint` : undefined;
  const errorId = error !== undefined ? `${id}-error` : undefined;
  // Both messages join the describedby list when both are shown, so screen
  // readers read the full context; the ids only exist while the message does.
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-espresso">
        {label}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error !== undefined ? true : undefined,
      })}
      {hint !== undefined && (
        <p id={hintId} className="text-xs text-taupe">
          {hint}
        </p>
      )}
      {error !== undefined && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
