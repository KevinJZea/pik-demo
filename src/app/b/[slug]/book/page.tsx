'use client';

import { Suspense, use, type ReactNode } from 'react';

import { BookingLoading, BookingWizard } from '@/components/booking';

/**
 * Booking wizard route (§13): one client page hosting all four steps. Params
 * and search params are Promises in Next 16 — the page unwraps the slug with
 * use() and wraps the wizard (which reads useSearchParams) in Suspense per
 * the useSearchParams docs.
 */
export default function BookPage(
  props: PageProps<'/b/[slug]/book'>,
): ReactNode {
  const { slug } = use(props.params);
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingWizard slug={slug} />
    </Suspense>
  );
}
