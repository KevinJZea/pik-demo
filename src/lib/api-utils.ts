import 'server-only';

import { z } from 'zod';

import type { ApiIssue } from './schemas';
import {
  ERROR_BAD_REQUEST,
  ERROR_DEMO_FAILED,
  ERROR_SLOT_TAKEN,
  ERROR_UNEXPECTED,
  zodIssues,
} from './schemas';

/**
 * Simulated-latency and demo-failure contract (AGENTS.md §8). The store is the
 * only latency source (300–600 ms per call); handlers add no extra sleep.
 *
 * `ApiIssue` is re-exported unchanged from schemas.ts (single definition of the
 * §8 error envelope shape). The error classes below flow from the store to
 * route handlers — they must never be thrown client-side.
 */

// Re-export the published shape instead of redeclaring it — `ApiIssue` is part
// of the §8 error envelope, so it must have exactly one definition.
export type { ApiIssue } from './schemas';

// Store-thrown errors; the handler maps each class to its HTTP status and
// uses the carried Spanish message as-is (§9).
export class ConflictError extends Error {}

export class NotFoundError extends Error {}

// Domain rules that fail as a 400 with their own final copy — e.g. a staff
// member who doesn't provide the requested service (§9 "El integrante no
// ofrece este servicio."). Distinct from zod issues: the message is complete,
// not a per-field issue.
export class BadRequestError extends Error {}

export function simulateLatency(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// `?fail=1` is the deterministic error-state trigger for demos/QA (§8, README);
// handlers must check it before touching the store so the 500 doesn't run
// domain logic.
export function shouldFail(request: Request): boolean {
  return new URL(request.url).searchParams.get('fail') === '1';
}

// Composed convenience for handlers: null when the demo flag is absent, else
// the §8 error response (await ~500 ms → 500). Await it first thing.
export async function failIfRequested(
  request: Request,
): Promise<Response | null> {
  if (!shouldFail(request)) return null;
  await simulateLatency(450, 550);
  return jsonError(500, ERROR_DEMO_FAILED);
}

export function jsonError(
  status: 400 | 404 | 409 | 500,
  error: string,
  issues?: ApiIssue[],
): Response {
  const body: { error: string; issues?: ApiIssue[] } = { error };
  if (issues?.length) body.issues = issues;
  return Response.json(body, { status });
}

export function jsonIssueResponse(error: z.ZodError): Response {
  return Response.json(
    { error: ERROR_BAD_REQUEST, issues: zodIssues(error) },
    { status: 400 },
  );
}

// Single place where store-thrown errors become the §8/§9 HTTP envelope. The
// classes carry their Spanish copy, so mapping is 1:1; unknown throwables are
// logged (for debugging) and answered with the generic 500 copy instead of
// leaking internals.
export function mapStoreError(error: unknown): Response {
  if (error instanceof ConflictError) return jsonError(409, ERROR_SLOT_TAKEN);
  if (error instanceof NotFoundError) return jsonError(404, error.message);
  if (error instanceof BadRequestError) return jsonError(400, error.message);
  console.error(error);
  return jsonError(500, ERROR_UNEXPECTED);
}
