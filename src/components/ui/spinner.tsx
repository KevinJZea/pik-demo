import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  /** Decorative only — callers provide context (button label, sr-only text). */
  children?: ReactNode;
};

export function Spinner({ className, ...rest }: SpinnerProps): ReactNode {
  // Border-trick spinner: only the top border is painted, the rest fades out
  // via opacity, and the rotation creates the arc look.
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70',
        className,
      )}
      {...rest}
    />
  );
}
