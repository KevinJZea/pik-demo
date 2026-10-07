'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  HoursEditor,
  StepShell,
  StepSkeleton,
  STEP_ROUTES,
  useStepGuard,
  useWizard,
} from '@/components/register';
import { Button, Field, Input } from '@/components/ui';
import { addressSchema, citySchema, weeklyHoursSchema } from '@/lib/schemas';
import type { Weekday } from '@/types/domain';

export default function RegisterLocationPage(): ReactNode {
  const { draft, dispatch } = useWizard();
  const router = useRouter();
  // Errors only surface from the first "Continuar" attempt on (§13).
  const [attempted, setAttempted] = useState(false);
  // Redirects to /register while step-1 prerequisites are missing.
  const ready = useStepGuard(1);

  const addressResult = addressSchema.safeParse(draft.address);
  const cityResult = citySchema.safeParse(draft.city);
  const hoursResult = weeklyHoursSchema.safeParse(draft.hours);
  const addressError =
    attempted && !addressResult.success
      ? addressResult.error.issues[0]?.message
      : undefined;
  const cityError =
    attempted && !cityResult.success
      ? cityResult.error.issues[0]?.message
      : undefined;

  // weeklyHoursSchema mixes per-day issues (open/close) with a whole-record
  // one ("debe abrir al menos un día" carries no path). Split them so each
  // day row shows its message and the record-level one shows under the grid.
  const dayErrors: Partial<Record<Weekday, string>> = {};
  let hoursLeadError: string | undefined;
  if (attempted && !hoursResult.success) {
    for (const issue of hoursResult.error.issues) {
      const day = Number(issue.path[0]);
      if (Number.isInteger(day)) {
        if (!(day in dayErrors)) dayErrors[day as Weekday] = issue.message;
      } else if (hoursLeadError === undefined) {
        hoursLeadError = issue.message;
      }
    }
  }

  const valid =
    addressResult.success && cityResult.success && hoursResult.success;

  function tryContinue(): void {
    setAttempted(true);
    if (valid) router.push(STEP_ROUTES[2]);
  }

  if (!ready) return <StepSkeleton />;

  return (
    <StepShell
      step={2}
      heading="Ubicación y horario"
      description="Dónde estás y qué días atiendes; el horario define las citas disponibles."
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
      <div className="space-y-5">
        <Field id="business-address" label="Dirección" error={addressError}>
          {(aria) => (
            <Input
              {...aria}
              autoComplete="street-address"
              value={draft.address}
              onChange={(event) =>
                dispatch({
                  type: 'setLocation',
                  patch: { address: event.target.value },
                })
              }
              placeholder="Av. Coyoacán 812, Col. Del Carmen"
            />
          )}
        </Field>
        <Field id="business-city" label="Ciudad" error={cityError}>
          {(aria) => (
            <Input
              {...aria}
              autoComplete="address-level2"
              value={draft.city}
              onChange={(event) =>
                dispatch({
                  type: 'setLocation',
                  patch: { city: event.target.value },
                })
              }
              placeholder="Ciudad de México"
            />
          )}
        </Field>

        <HoursEditor
          hours={draft.hours}
          onChange={(hours) => dispatch({ type: 'setHours', hours })}
          dayErrors={dayErrors}
        />
        {hoursLeadError !== undefined && (
          // Whole-grid issue: goes under it, still wired to the attempted flow.
          <p role="alert" className="text-xs text-danger">
            {hoursLeadError}
          </p>
        )}
      </div>
    </StepShell>
  );
}
