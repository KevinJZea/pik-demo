import type { ReactElement, SVGProps } from 'react';

import type { BusinessCategory } from '@/types/domain';

type Glyph = (props: SVGProps<SVGSVGElement>) => ReactElement;

export type CategoryConfig = {
  label: string;
  glyph: Glyph;
  gradient: readonly [string, string];
};

function ScissorsGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="6" cy="17" r="2.75" />
      <circle cx="18" cy="17" r="2.75" />
      <path d="M7.9 14.6 17 4.5M16.1 14.6 7 4.5" />
    </svg>
  );
}

function RazorGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="7" y="4" width="10" height="4.5" rx="1.2" />
      <path d="M9.5 8.5v2M12 8.5v2M14.5 8.5v2" />
      <path d="M12 10.5V19" />
    </svg>
  );
}

function LeafGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M19.5 4.5C10.5 4.9 5.6 10.2 5.2 19.8c9.6-.4 14-5.8 14.3-15.3Z" />
      <path d="M5.5 19.5 15.5 9" />
    </svg>
  );
}

function PolishGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="10" y="2.5" width="4" height="5" rx="1.2" />
      <path d="M9.5 12V9.5a2.5 2.5 0 0 1 5 0V12" />
      <rect x="8.5" y="12" width="7" height="9" rx="2" />
      <path d="M10.5 15.5h3" />
    </svg>
  );
}

export const CATEGORIES: Record<BusinessCategory, CategoryConfig> = {
  salon: {
    label: 'Salón de belleza',
    glyph: ScissorsGlyph,
    gradient: ['#A75D7F', '#6C3B54'],
  },
  barbershop: {
    label: 'Barbería',
    glyph: RazorGlyph,
    gradient: ['#A08262', '#57402F'],
  },
  spa: {
    label: 'Spa',
    glyph: LeafGlyph,
    gradient: ['#9DB89A', '#5F7F61'],
  },
  'nail-studio': {
    label: 'Estudio de uñas',
    glyph: PolishGlyph,
    gradient: ['#D08A5A', '#8F4E2E'],
  },
};

/** Ready `background` value for a business cover, e.g. on a hero band. */
export function gradientBackground(
  gradient: readonly [string, string],
): string {
  return `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`;
}
