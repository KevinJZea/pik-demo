import 'server-only';

import { z } from 'zod';

import { ApiIssue, ERROR_BAD_REQUEST, zodIssues } from './schemas';

/**
 * Simulated-latency and demo-failure contract (AGENTS.md §8). The store is the
 * only latency source (300–600 ms per call); handlers add no extra sleep.
 *
 * `ApiIssue` is re-exported unchanged from schemas.ts (single definition of the
 * §8 error envelope shape). ConflictError/NotFoundError flow from the store to
 * route handlers — they must never be thrown client-side.
 */

// Re-export the published shape instead of redeclaring it — `ApiIssue` is part
// of the §8 error envelope, so it must have exactly one definition.
export type { ApiIssue } from './schemas';

export class ConflictError extends Error {}

export class NotFoundError extends Error {}

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
