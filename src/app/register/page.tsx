'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  CategoryPicker,
  StepShell,
  StepSkeleton,
  STEP_ROUTES,
  useWizard,
} from '@/components/register';
import { Button, Field, Input } from '@/components/ui';
import { businessNameSchema, businessPhoneSchema } from '@/lib/schemas';

export default function RegisterDetailsPage(): ReactNode {
  const { draft, dispatch, hydrated } = useWizard();
  const router = useRouter();
  // Errors only surface from the first "Continuar" attempt on (§13): no
  // nagging while typing for the first time on each step.
  const [attempted, setAttempted] = useState(false);

  // Copy is derived from the shared schemas' own issues (§9, no literals).
  const nameResult = businessNameSchema.safeParse(draft.name);
  const phoneResult = businessPhoneSchema.safeParse(draft.phone);
  const nameError =
    attempted && !nameResult.success
      ? nameResult.error.issues[0]?.message
      : undefined;
  const phoneError =
    attempted && !phoneResult.success
      ? phoneResult.error.issues[0]?.message
      : undefined;
  const categoryError =
    attempted && draft.category === null ? 'Elige una categoría.' : undefined;

  const valid =
    nameResult.success && draft.category !== null && phoneResult.success;

  function tryContinue(): void {
    setAttempted(true);
    if (valid) router.push(STEP_ROUTES[1]);
  }

  if (!hydrated) return <StepSkeleton />;

  return (
    <StepShell
      step={1}
      heading="Cuéntanos de tu negocio"
      description="Lo básico para crear tu perfil público y empezar a recibir reservas."
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
        <Field id="business-name" label="Nombre del negocio" error={nameError}>
          {(aria) => (
            <Input
              {...aria}
              value={draft.name}
              onChange={(event) =>
                dispatch({
                  type: 'setDetails',
                  patch: { name: event.target.value },
                })
              }
              placeholder="Barbería Don Rafa"
            />
          )}
        </Field>

        <fieldset
          aria-describedby={
            categoryError !== undefined ? 'category-error' : undefined
          }
          className="flex flex-col gap-1.5"
        >
          <legend className="text-sm font-medium text-espresso">
            Categoría
          </legend>
          <CategoryPicker
            value={draft.category}
            onChange={(category) =>
              dispatch({ type: 'setDetails', patch: { category } })
            }
          />
          {categoryError !== undefined && (
            <p id="category-error" role="alert" className="text-xs text-danger">
              {categoryError}
            </p>
          )}
        </fieldset>

        <Field
          id="business-phone"
          label="Teléfono de contacto"
          hint="Solo se muestra en tu perfil público."
          error={phoneError}
        >
          {(aria) => (
            <Input
              {...aria}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={draft.phone}
              onChange={(event) =>
                dispatch({
                  type: 'setDetails',
                  patch: { phone: event.target.value },
                })
              }
              placeholder="55 1234 5678"
            />
          )}
        </Field>
      </div>
    </StepShell>
  );
}
