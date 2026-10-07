'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  StepShell,
  StepSkeleton,
  SummaryGroups,
  useStepGuard,
  useWizard,
} from '@/components/register';
import { Button, ErrorPanel } from '@/components/ui';
import {
  ERROR_BAD_REQUEST,
  ERROR_UNEXPECTED,
  createBusinessSchema,
  zodIssues,
  type ApiIssue,
} from '@/lib/schemas';
import { PikApiError, createBusiness } from '@/lib/api';

export default function RegisterSummaryPage(): ReactNode {
  const { draft, dispatch } = useWizard();
  const router = useRouter();
  // Redirects to the first incomplete step among 1–4 when missing.
  const ready = useStepGuard(4);
  const [issues, setIssues] = useState<ApiIssue[] | null>(null);
  // Server-level failure message (500/network); retry re-runs the submit.
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Failure focus target: keyboard and screen-reader users get moved to the
  // banner instead of hunting for it (steps move focus to h1 on navigation).
  const issuesRef = useRef<HTMLDivElement | null>(null);

  // Client pre-parse enforces the exact same rules as the server before any
  // request leaves; the payload is the schema's own output (§8: ids kept).
  const parsed = createBusinessSchema.safeParse(draft);

  async function submit(): Promise<void> {
    if (!parsed.success) {
      setIssues(zodIssues(parsed.error));
      return;
    }
    setIssues(null);
    setServerError(null);
    setSubmitting(true);
    try {
      const business = await createBusiness(parsed.data);
      // 201: clear the draft (the persisted copy goes with it) and hand off
      // to the RSC confirmation which reads the new business from the store.
      dispatch({ type: 'reset' });
      router.push(`/register/success?b=${encodeURIComponent(business.slug)}`);
    } catch (error) {
      setSubmitting(false);
      if (error instanceof PikApiError && error.issues !== undefined) {
        // 400: show the zod issue messages inline, as a top banner (§13).
        setIssues(error.issues);
      } else if (error instanceof PikApiError) {
        setServerError(error.message);
      } else {
        setServerError(ERROR_UNEXPECTED);
      }
    }
  }

  useEffect(() => {
    if (issues !== null) issuesRef.current?.focus();
  }, [issues]);

  if (!ready) return <StepSkeleton />;

  // Dedupe repeated copies across rows (same rule fails on two members).
  const issueMessages =
    issues !== null ? [...new Set(issues.map((issue) => issue.message))] : [];

  return (
    <StepShell
      step={5}
      heading="Resumen"
      description="Revisa todo antes de crear tu negocio."
      cta={
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full sm:w-auto sm:min-w-72"
          >
            Confirmar y crear mi negocio
          </Button>
        </form>
      }
    >
      <div className="space-y-4">
        {issues !== null && issues.length > 0 && (
          // 400 banner (§13): the exact generic copy + each issue message.
          <div
            ref={issuesRef}
            tabIndex={-1}
            role="alert"
            className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm focus:outline-none"
          >
            <p className="font-semibold text-danger">{ERROR_BAD_REQUEST}</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
              {issueMessages.map((message) => (
                <li key={message} className="text-espresso">
                  {message}
                </li>
              ))}
            </ul>
          </div>
        )}
        {serverError !== null && (
          <ErrorPanel message={serverError} onRetry={() => void submit()} />
        )}
        <SummaryGroups draft={draft} />
      </div>
    </StepShell>
  );
}
