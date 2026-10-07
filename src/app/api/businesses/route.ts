import { createBusinessSchema } from '@/lib/schemas';

import {
  failIfRequested,
  jsonIssueResponse,
  mapStoreError,
} from '@/lib/api-utils';
import { store } from '@/lib/store';

/**
 * POST /api/businesses — registration summary submit (AGENTS.md §8.1).
 * The client supplies service/staff ids; the server assigns id/slug/createdAt.
 */
export async function POST(request: Request): Promise<Response> {
  const failed = await failIfRequested(request);
  if (failed) return failed;

  const body: unknown = await request.json().catch(() => null);
  const parsed = createBusinessSchema.safeParse(body);
  if (!parsed.success) return jsonIssueResponse(parsed.error);

  try {
    const business = await store.createBusiness(parsed.data);
    return Response.json(business, { status: 201 });
  } catch (error) {
    return mapStoreError(error);
  }
}
