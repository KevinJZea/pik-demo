import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export function Card({ className, ...rest }: CardProps): ReactNode {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-card shadow-xs',
        className,
      )}
      {...rest}
    />
  );
}
