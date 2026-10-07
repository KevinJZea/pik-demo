import { createAppointmentSchema } from '@/lib/schemas';

import {
  failIfRequested,
  jsonIssueResponse,
  mapStoreError,
} from '@/lib/api-utils';
import { store } from '@/lib/store';

/**
 * POST /api/appointments — booking confirm + fake pay (§8.4). The store
 * re-checks every state-dependent rule; ConflictError/NotFoundError/
 * BadRequestError map to 409/404/400 with their carried Spanish copy.
 */
export async function POST(request: Request): Promise<Response> {
  const failed = await failIfRequested(request);
  if (failed) return failed;

  const body: unknown = await request.json().catch(() => null);
  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) return jsonIssueResponse(parsed.error);

  try {
    const appointment = await store.createAppointment(parsed.data);
    return Response.json(appointment, { status: 201 });
  } catch (error) {
    return mapStoreError(error);
  }
}
