import Link from 'next/link';
import type { ReactNode } from 'react';

import { CATEGORIES, gradientBackground } from '@/lib/categories';
import type { Business } from '@/types/domain';
import { Badge } from '@/components/ui';

export type BusinessCardProps = {
  business: Business;
};

/** Directory card for the home grid: whole card is one Link (zero client JS). */
export function BusinessCard({ business }: BusinessCardProps): ReactNode {
  const category = CATEGORIES[business.category];
  const Glyph = category.glyph;

  return (
    <Link
      href={`/b/${business.slug}`}
      className="block overflow-hidden rounded-2xl border border-line bg-card shadow-xs transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
    >
      <div
        aria-hidden="true"
        className="grid h-28 place-items-center text-white"
        style={{ background: gradientBackground(category.gradient) }}
      >
        <Glyph className="h-12 w-12" />
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-espresso">
          {business.name}
        </h3>
        <Badge tone="terracotta" className="mt-2">
          {category.label}
        </Badge>
        <p className="mt-2 text-sm text-taupe">
          {business.address}, {business.city}
        </p>
      </div>
    </Link>
  );
}
