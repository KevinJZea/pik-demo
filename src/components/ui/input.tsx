import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Rendered as a red border + red focus ring when aria-invalid is truthy. */
  'aria-invalid'?: boolean | 'true' | 'false';
};

const BASE =
  'min-h-11 w-full rounded-xl border bg-sand px-3.5 text-base text-espresso placeholder:text-taupe/70 transition-colors focus:outline-none focus-visible:ring-2';

export function Input({
  className,
  'aria-invalid': ariaInvalid,
  ...rest
}: InputProps): ReactNode {
  // aria-invalid is the single source of truth for the error styling, so the
  // aria attribute (wired by Field) and the visual state can never diverge.
  const invalid = ariaInvalid === true || ariaInvalid === 'true';
  return (
    <input
      aria-invalid={ariaInvalid}
      className={cn(
        BASE,
        invalid
          ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/30'
          : 'border-line focus-visible:border-plum focus-visible:ring-plum/30',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...rest}
    />
  );
}
