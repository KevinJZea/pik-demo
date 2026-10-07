'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  ServicesEditor,
  StepShell,
  StepSkeleton,
  STEP_ROUTES,
  isStepComplete,
  useStepGuard,
  useWizard,
} from '@/components/register';
import { Button } from '@/components/ui';

export default function RegisterServicesPage(): ReactNode {
  const { draft } = useWizard();
  const router = useRouter();
  const [attempted, setAttempted] = useState(false);
  // Redirects to the first incomplete step among 1–2 when missing.
  const ready = useStepGuard(2);

  // Minimum-count gate for the step; per-row validity is guaranteed by the
  // editor, which only commits schema-valid services.
  const valid = isStepComplete(draft, 2);
  const minError =
    attempted && !valid
      ? 'Agrega al menos un servicio antes de continuar.'
      : undefined;

  function tryContinue(): void {
    setAttempted(true);
    if (valid) router.push(STEP_ROUTES[3]);
  }

  if (!ready) return <StepSkeleton />;

  return (
    <StepShell
      step={3}
      heading="Servicios"
      description="Lo que ofreces, con duración y precio por servicio."
      cta={
        <Button
          size="lg"
          className="w-full sm:w-auto sm:min-w-48"
          onClick={tryContinue}
        >
          Continuar
        </Button>
      }
    >
      <ServicesEditor />
      {minError !== undefined && (
        // Under the sticky-bar flow but announced; the editor rows stay clean.
        <p role="alert" className="mt-4 text-sm text-danger">
          {minError}
        </p>
      )}
    </StepShell>
  );
}
