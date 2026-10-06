import type { ReactNode } from 'react';

import { cn } from './cn';

export type EmptyStateProps = {
  title: string;
  body?: string;
  /** Call-site slot for a Button or Link-style CTA. */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  body,
  action,
  icon,
  className,
}: EmptyStateProps): ReactNode {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-card px-6 py-10 text-center',
        className,
      )}
    >
      {icon !== undefined && (
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-sand text-taupe">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-espresso">{title}</h3>
      {body !== undefined && (
        <p className="mx-auto mt-1 max-w-100 text-sm text-taupe">{body}</p>
      )}
      {action !== undefined && <div className="mt-4">{action}</div>}
    </div>
  );
}
