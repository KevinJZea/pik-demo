'use client';

import type { ReactNode } from 'react';

import { cn } from './cn';
import { Button } from './button';

export type ErrorPanelProps = {
  message: string;
  /** Optional title above the message. */
  title?: string;
  /** Renders the "Reintentar" action when provided. */
  onRetry?: () => void;
  className?: string;
};

export function ErrorPanel({
  message,
  title,
  onRetry,
  className,
}: ErrorPanelProps): ReactNode {
  return (
    // role="alert" so screen readers announce the failure as soon as it renders.
    <div
      role="alert"
      className={cn(
        'rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm',
        className,
      )}
    >
      <div className="flex gap-3">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 shrink-0 text-danger"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4.5M12 16h.01" />
        </svg>
        <div className="min-w-0">
          <p className="font-semibold text-danger">
            {title ?? 'Algo salió mal'}
          </p>
          <p className="mt-1 text-espresso">{message}</p>
          {onRetry !== undefined && (
            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={onRetry}>
                Reintentar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
