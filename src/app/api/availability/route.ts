import {
  ERROR_UNKNOWN_BUSINESS,
  ERROR_UNKNOWN_SERVICE,
  availabilityQuerySchema,
} from '@/lib/schemas';

import { generateSlots } from '@/lib/availability';
import {
  failIfRequested,
  jsonError,
  jsonIssueResponse,
  mapStoreError,
} from '@/lib/api-utils';
import { store } from '@/lib/store';

/**
 * GET /api/availability — slot grid for one service/staff/date (§8.3).
 * Closed day → 200 []; fully booked day → all slots available:false.
 * Staff-resolution errors (404/400 copy) come from generateSlots.
 */
export async function GET(request: Request): Promise<Response> {
  const failed = await failIfRequested(request);
  if (failed) return failed;

  const parsed = availabilityQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return jsonIssueResponse(parsed.error);
  const { business: slug, service: serviceId, staff, date } = parsed.data;

  try {
    const business = await store.getBusinessBySlug(slug);
    if (!business) return jsonError(404, ERROR_UNKNOWN_BUSINESS);
    const service = business.services.find((item) => item.id === serviceId);
    if (!service) return jsonError(404, ERROR_UNKNOWN_SERVICE);

    // Two awaited store calls → up to 1.2 s total; the wizard skeletons cover
    // the wait (§13). Both sleeps are inside the store, not here (§8).
    const appointments = await store.listAppointments(business.id);
    const slots = generateSlots(business, service, staff, date, appointments);
    return Response.json(slots);
  } catch (error) {
    return mapStoreError(error);
  }
}
