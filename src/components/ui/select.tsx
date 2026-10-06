import type { ReactNode, SelectHTMLAttributes } from 'react';

import { cn } from './cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Rendered as a red border + red focus ring when aria-invalid is truthy. */
  'aria-invalid'?: boolean | 'true' | 'false';
};

const BASE =
  'min-h-11 w-full rounded-xl border bg-sand px-3.5 text-base text-espresso transition-colors focus:outline-none focus-visible:ring-2';

export function Select({
  className,
  'aria-invalid': ariaInvalid,
  children,
  ...rest
}: SelectProps): ReactNode {
  const invalid = ariaInvalid === true || ariaInvalid === 'true';
  return (
    <select
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
    >
      {children}
    </select>
  );
}
