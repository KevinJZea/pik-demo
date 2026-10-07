'use client';

import { useState, type ReactNode } from 'react';

import { useWizard } from './wizard-provider';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
} from '@/components/ui';
import { formatDuration, formatPrice } from '@/lib/format';
import { priceCentsSchema, serviceNameSchema } from '@/lib/schemas';
import type { Service } from '@/types/domain';

// Duration options: every multiple of 15 in the schema range 15–240 (§9) —
// a select makes the "multiple of 15" rule unreachable in the UI.
const DURATIONS: number[] = [];
for (let minutes = 15; minutes <= 240; minutes += 15) {
  DURATIONS.push(minutes);
}

type RowForm = {
  /** 'new' when adding, a service id when editing, null when closed. */
  target: 'new' | string | null;
  name: string;
  /** Select value — always a valid multiple of 15 as text. */
  durationMin: string;
  /** Text field for pesos (e.g. "350" or "350.50"); converted to cents. */
  price: string;
  attempted: boolean;
};

const CLOSED_FORM: RowForm = {
  target: null,
  name: '',
  durationMin: '30',
  price: '',
  attempted: false,
};

/** Pesos text → integer cents; NaN flows into the price schema and fails it
 * with the exact "El precio debe ser mayor a $0…" copy (§9). */
function parsePesosToCents(text: string): number {
  const normalized = text.trim().replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : Number.NaN;
}

export function ServicesEditor(): ReactNode {
  const { draft, dispatch } = useWizard();
  const services = draft.services;
  const [form, setForm] = useState<RowForm>(CLOSED_FORM);

  const editing = form.target !== null;
  const editingService =
    editing && form.target !== 'new'
      ? (draft.services.find((service) => service.id === form.target) ?? null)
      : null;

  function openAdd(): void {
    setForm({ ...CLOSED_FORM, target: 'new', attempted: false });
  }

  function openEdit(service: Service): void {
    // Price is shown in pesos, with a decimal when cents are non-zero.
    setForm({
      target: service.id,
      name: service.name,
      durationMin: String(service.durationMin),
      price: (service.priceCents / 100).toString(),
      attempted: false,
    });
  }

  /** Validates the row against the shared schemas and commits it on success. */
  function saveRow(): void {
    const nameResult = serviceNameSchema.safeParse(form.name);
    const priceResult = priceCentsSchema.safeParse(
      parsePesosToCents(form.price),
    );
    if (!nameResult.success || !priceResult.success) {
      setForm((current) => ({ ...current, attempted: true }));
      return;
    }
    const next: Service = {
      // Brand-new rows mint a UUID client-side so staff.serviceIds can
      // reference the service even before any server exists for it (§8).
      id: editingService?.id ?? crypto.randomUUID(),
      name: nameResult.data,
      durationMin: Number(form.durationMin),
      priceCents: priceResult.data,
    };
    if (editingService === null) {
      dispatch({ type: 'addService', service: next });
    } else {
      dispatch({
        type: 'updateService',
        id: editingService.id,
        patch: {
          name: next.name,
          durationMin: next.durationMin,
          priceCents: next.priceCents,
        },
      });
    }
    setForm(CLOSED_FORM);
  }

  // Error copy comes from the shared schemas themselves (issues[0].message),
  // so UI text can never drift from Backend's contract copy (§9).
  const nameResult = serviceNameSchema.safeParse(form.name);
  const nameError =
    form.attempted && !nameResult.success
      ? nameResult.error.issues[0]?.message
      : undefined;
  const priceResult = priceCentsSchema.safeParse(parsePesosToCents(form.price));
  const priceError =
    form.attempted && !priceResult.success
      ? priceResult.error.issues[0]?.message
      : undefined;

  return (
    <div className="space-y-3">
      {!editing && (
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={openAdd}
        >
          + Agregar servicio
        </Button>
      )}

      {editing && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-espresso">
            {form.target === 'new' ? 'Nuevo servicio' : 'Editar servicio'}
          </p>
          <div className="mt-3 space-y-3">
            <Field id="service-name" label="Nombre" error={nameError}>
              {(aria) => (
                <Input
                  {...aria}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Corte clásico"
                />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field
                id="service-duration"
                label="Duración"
                hint="Múltiplos de 15"
              >
                {(aria) => (
                  <Select
                    {...aria}
                    value={form.durationMin}
                    onChange={(event) =>
                      setForm({ ...form, durationMin: event.target.value })
                    }
                  >
                    {DURATIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {formatDuration(minutes)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field
                id="service-price"
                label="Precio (MXN)"
                hint="Se cobra en línea (simulado)."
                error={priceError}
              >
                {(aria) => (
                  <Input
                    {...aria}
                    inputMode="decimal"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    placeholder="350"
                  />
                )}
              </Field>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setForm(CLOSED_FORM)}>
              Cancelar
            </Button>
            <Button onClick={saveRow}>Guardar</Button>
          </div>
        </Card>
      )}

      {services.length === 0 && !editing ? (
        // Required empty state (§13): first-run services step.
        <EmptyState
          title="Agrega tu primer servicio"
          body="Los clientes verán cada servicio con su duración y precio al reservar."
          action={
            <Button variant="secondary" onClick={openAdd}>
              Agregar servicio
            </Button>
          }
        />
      ) : (
        services.map((service) => (
          <Card key={service.id} className="p-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-espresso">
                  {service.name}
                </p>
                <p className="mt-0.5 text-xs text-taupe">
                  {formatDuration(service.durationMin)} ·{' '}
                  {formatPrice(service.priceCents)}
                </p>
              </div>
              {!editing && (
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(service)}
                  >
                    Editar
                  </Button>
                  {/* Dispatches the D24 cascade: the id also leaves every
                      staff member's serviceIds, via the reducer. */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      dispatch({ type: 'deleteService', id: service.id })
                    }
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
