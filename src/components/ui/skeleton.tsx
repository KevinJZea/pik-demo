import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

/**
 * Decorative loading placeholder — size and shape come from `className`
 * (e.g. "h-4 w-full rounded-full"). Wrap groups with `role="status"` and a
 * visually hidden label when the skeleton is the page's only content.
 */
export function Skeleton({ className, ...rest }: SkeletonProps): ReactNode {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-sand', className)}
      {...rest}
    />
  );
}
