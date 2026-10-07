'use client';

import type { ReactNode } from 'react';

import { CATEGORIES, gradientBackground } from '@/lib/categories';
import { BUSINESS_CATEGORIES } from '@/types/domain';
import type { BusinessCategory } from '@/types/domain';

import { cn } from '@/components/ui/cn';

export type CategoryPickerProps = {
  value: BusinessCategory | null;
  onChange: (category: BusinessCategory) => void;
};

export function CategoryPicker({
  value,
  onChange,
}: CategoryPickerProps): ReactNode {
  return (
    // radiogroup/radio keeps the choice-card pattern native to screen readers
    // (a plain button grid would read as four unrelated buttons).
    <div
      role="radiogroup"
      aria-label="Categoría del negocio"
      className="grid grid-cols-2 gap-2.5"
    >
      {BUSINESS_CATEGORIES.map((category) => {
        const config = CATEGORIES[category];
        const Glyph = config.glyph;
        const selected = value === category;
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(category)}
            className={cn(
              'rounded-2xl border bg-card p-3 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2',
              selected
                ? 'border-plum ring-2 ring-plum'
                : 'border-line hover:bg-sand',
            )}
          >
            <span
              aria-hidden="true"
              className="grid h-12 w-12 place-items-center rounded-xl text-white"
              style={{ background: gradientBackground(config.gradient) }}
            >
              <Glyph className="h-6 w-6" />
            </span>
            <span className="mt-2.5 block text-sm font-medium text-espresso">
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
