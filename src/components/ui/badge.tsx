import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

export type BadgeTone = 'neutral' | 'plum' | 'terracotta' | 'sage' | 'danger';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children?: ReactNode;
};

// Terracotta and sage fail 4.5:1 both as solid-bg/white text (~3–4:1) and as
// colored text on sand (~3.1–3.4:1), so those two tones use a light tint
// background with a darkened text hex instead (≈6:1 / ≈7:1 on white).
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-sand text-espresso',
  plum: 'bg-plum text-white',
  terracotta: 'bg-terracotta/15 text-[#7A4524]',
  sage: 'bg-sage/15 text-[#3F5A3D]',
  danger: 'bg-danger text-white',
};

export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: BadgeProps): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}
