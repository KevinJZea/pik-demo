'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  StaffEditor,
  StepShell,
  StepSkeleton,
  STEP_ROUTES,
  isStepComplete,
  useStepGuard,
  useWizard,
} from '@/components/register';
import { Button } from '@/components/ui';
import { staffInputSchema } from '@/lib/schemas';

export default function RegisterStaffPage(): ReactNode {
  const { draft } = useWizard();
  const router = useRouter();
  // Per-row errors derive from the shared schema after the first attempt.
  const [attempted, setAttempted] = useState(false);
  // Redirects to the first incomplete step among 1–3 when missing.
  const ready = useStepGuard(3);

  // One message per member (the first zod issue) — the common one after a
  // service delete cascade ("Asigna al menos un servicio a cada integrante.").
  const rowErrors: Record<string, string | undefined> = {};
  if (attempted) {
    for (const member of draft.staff) {
      const result = staffInputSchema.safeParse(member);
      if (!result.success)
        rowErrors[member.id] = result.error.issues[0]?.message;
    }
  }
  const valid = isStepComplete(draft, 3);
  const minError =
    attempted && draft.staff.length === 0
      ? 'Agrega al menos un integrante antes de continuar.'
      : undefined;

  function tryContinue(): void {
    setAttempted(true);
    if (valid) router.push(STEP_ROUTES[4]);
  }

  if (!ready) return <StepSkeleton />;

  return (
    <StepShell
      step={4}
      heading="Equipo"
      description="Quiénes prestan los servicios agendados."
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
      <p className="text-sm text-taupe">
        Agrégate a ti mismo/a si trabajas solo/a.
      </p>
      <div className="mt-4">
        <StaffEditor rowErrors={rowErrors} />
      </div>
      {minError !== undefined && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {minError}
        </p>
      )}
    </StepShell>
  );
}
