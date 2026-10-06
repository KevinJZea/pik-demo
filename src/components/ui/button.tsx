'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';
import { Spinner } from './spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a Spinner and disables the button while an async action runs. */
  loading?: boolean;
};

const VARIANTS: Record<ButtonVariant, string> = {
  // white on plum ≈ 7:1, white on danger ≈ 5.7:1 — both ≥ AA (§13).
  primary: 'bg-plum text-white hover:bg-plum-deep active:bg-plum-deep',
  secondary: 'border border-line bg-card text-espresso hover:bg-sand',
  ghost: 'text-espresso hover:bg-sand',
  danger: 'bg-danger text-white hover:opacity-90',
};

// min-h-11 (44px) on every size keeps hit targets at the §13 accessibility
// baseline; sizes differ through padding and type size only.
const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps): ReactNode {
  return (
    <button
      type={type}
      // loading implies disabled: no double submits while the request runs.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner className="h-4 w-4" />
          <span className="sr-only">Cargando…</span>
        </>
      ) : null}
      {children}
    </button>
  );
}
