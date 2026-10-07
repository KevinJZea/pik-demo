import { ERROR_UNKNOWN_BUSINESS } from '@/lib/schemas';

import { failIfRequested, jsonError, mapStoreError } from '@/lib/api-utils';
import { store } from '@/lib/store';

/**
 * GET /api/businesses/[slug] — one business for the booking wizard (§8.2).
 * Unknown slug → 404; the profile page itself reads the store directly (RSC).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const failed = await failIfRequested(request);
  if (failed) return failed;

  const { slug } = await params;

  try {
    const business = await store.getBusinessBySlug(slug);
    if (!business) return jsonError(404, ERROR_UNKNOWN_BUSINESS);
    return Response.json(business);
  } catch (error) {
    return mapStoreError(error);
  }
}
