'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';

import { useWizard } from './wizard-provider';
import { Button, Card, EmptyState, Field, Input } from '@/components/ui';
import { roleSchema, staffNameSchema, staffInputSchema } from '@/lib/schemas';

type RowForm = {
  /** 'new' when adding, a staff id when editing, null when closed. */
  target: 'new' | string | null;
  name: string;
  role: string;
  /** Set of checked service ids for the row form. */
  serviceIds: string[];
  attempted: boolean;
};

const CLOSED_FORM: RowForm = {
  target: null,
  name: '',
  role: '',
  serviceIds: [],
  attempted: false,
};

export type StaffEditorProps = {
  /**
   * One optional message per member id (first issue of the row), computed by
   * the page from the shared staffInputSchema — mainly the "left with zero
   * services" case after a D24 cascade delete.
   */
  rowErrors?: Readonly<Record<string, string | undefined>>;
};

export function StaffEditor({ rowErrors = {} }: StaffEditorProps): ReactNode {
  const { draft, dispatch } = useWizard();
  const [form, setForm] = useState<RowForm>(CLOSED_FORM);

  const editing = form.target !== null;
  const editingMember =
    editing && form.target !== 'new'
      ? (draft.staff.find((member) => member.id === form.target) ?? null)
      : null;

  function openAdd(): void {
    setForm({ ...CLOSED_FORM, target: 'new', attempted: false });
  }

  function openEdit(memberId: string): void {
    const member = draft.staff.find((item) => item.id === memberId);
    if (member === undefined) return;
    setForm({
      target: member.id,
      name: member.name,
      role: member.role,
      serviceIds: [...member.serviceIds],
      attempted: false,
    });
  }

  function toggleService(serviceId: string, checked: boolean): void {
    setForm((current) => ({
      ...current,
      serviceIds: checked
        ? [...current.serviceIds, serviceId]
        : current.serviceIds.filter((id) => id !== serviceId),
    }));
  }

  /** Validates the row against the shared schemas and commits it on success. */
  function saveRow(): void {
    // Only currently-existing services may be assigned: intersect with the
    // services the owner has at this moment (the editor list is the truth).
    const known = new Set(draft.services.map((service) => service.id));
    const serviceIds = form.serviceIds.filter((id) => known.has(id));
    const nameResult = staffNameSchema.safeParse(form.name);
    const roleResult = roleSchema.safeParse(form.role);
    const servicesResult =
      staffInputSchema.shape.serviceIds.safeParse(serviceIds);
    if (!nameResult.success || !roleResult.success || !servicesResult.success) {
      setForm((current) => ({ ...current, attempted: true }));
      return;
    }
    const next = {
      // Brand-new members mint a UUID client-side (§8); ids stay immutable.
      id: editingMember?.id ?? crypto.randomUUID(),
      name: nameResult.data,
      role: roleResult.data,
      serviceIds,
    };
    if (editingMember === null) {
      dispatch({ type: 'addStaff', member: next });
    } else {
      dispatch({
        type: 'updateStaff',
        id: editingMember.id,
        patch: {
          name: next.name,
          role: next.role,
          serviceIds: next.serviceIds,
        },
      });
    }
    setForm(CLOSED_FORM);
  }

  // Copy derived from the shared schemas — never drifted literals (§9).
  const nameResult = staffNameSchema.safeParse(form.name);
  const roleResult = roleSchema.safeParse(form.role);
  const known = new Set(draft.services.map((service) => service.id));
  const servicesResult = staffInputSchema.shape.serviceIds.safeParse(
    form.serviceIds.filter((id) => known.has(id)),
  );
  const nameError =
    form.attempted && !nameResult.success
      ? nameResult.error.issues[0]?.message
      : undefined;
  const roleError =
    form.attempted && !roleResult.success
      ? roleResult.error.issues[0]?.message
      : undefined;
  const servicesError =
    form.attempted && !servicesResult.success
      ? servicesResult.error.issues[0]?.message
      : undefined;

  // The name/role/services row form is only reachable when services exist —
  // otherwise the designed empty state takes over the whole step.
  const servicesAvailable = draft.services.length >= 1;

  const secondaryLink =
    // Same face as Button variant="secondary"; plain classes because there
    // is no Link variant in the ui set and cn has no class-merge logic.
    'inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-card px-5 text-sm font-medium text-espresso transition-colors hover:bg-sand';

  return (
    <div className="space-y-3">
      {!editing && (
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={openAdd}
        >
          + Agregar integrante
        </Button>
      )}

      {editing && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-espresso">
            {form.target === 'new' ? 'Nuevo integrante' : 'Editar integrante'}
          </p>
          <div className="mt-3 space-y-3">
            <Field id="staff-name" label="Nombre" error={nameError}>
              {(aria) => (
                <Input
                  {...aria}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Ana López"
                />
              )}
            </Field>
            <Field id="staff-role" label="Rol" error={roleError}>
              {(aria) => (
                <Input
                  {...aria}
                  value={form.role}
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value })
                  }
                  placeholder="Estilista principal"
                />
              )}
            </Field>
            <fieldset
              aria-describedby={
                servicesError !== undefined ? 'staff-services-error' : undefined
              }
              className="flex flex-col gap-1.5"
            >
              <legend className="text-sm font-medium text-espresso">
                Servicios que ofrece
              </legend>
              <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {draft.services.map((service) => {
                  const checked = form.serviceIds.includes(service.id);
                  return (
                    // Full-width labels double as the ≥44 px touch target.
                    <label
                      key={service.id}
                      className="flex min-h-11 items-center gap-2.5 rounded-xl border border-line bg-sand px-3 text-sm text-espresso"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          toggleService(service.id, event.target.checked)
                        }
                        className="h-4 w-4 accent-plum"
                      />
                      {service.name}
                    </label>
                  );
                })}
              </div>
              {servicesError !== undefined && (
                <p
                  id="staff-services-error"
                  role="alert"
                  className="text-xs text-danger"
                >
                  {servicesError}
                </p>
              )}
            </fieldset>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setForm(CLOSED_FORM)}>
              Cancelar
            </Button>
            <Button onClick={saveRow}>Guardar</Button>
          </div>
        </Card>
      )}

      {!editing && !servicesAvailable && (
        // No services to assign yet: staff step presumes services exist.
        <EmptyState
          title="Primero agrega servicios"
          body="Cada integrante ofrece al menos un servicio; vuelve al paso de servicios para agregarlos."
          action={
            <Link href="/register/services" className={secondaryLink}>
              Ir a servicios
            </Link>
          }
        />
      )}

      {!editing && servicesAvailable && draft.staff.length === 0 && (
        // Required empty state (§13): services exist, no team members yet.
        <EmptyState
          title="Agrega tu primer integrante"
          body="Cada integrante ofrece al menos un servicio; los clientes reservan con personas concretas."
          action={
            <Button variant="secondary" onClick={openAdd}>
              Agregar integrante
            </Button>
          }
        />
      )}

      {!editing &&
        draft.staff.map((member) => {
          const rowError = rowErrors[member.id];
          return (
            <Card key={member.id} className="p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-espresso">
                    {member.name}
                  </p>
                  <p className="mt-0.5 text-xs text-taupe">{member.role}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {member.serviceIds.map((serviceId) => {
                      const service = draft.services.find(
                        (item) => item.id === serviceId,
                      );
                      if (service === undefined) return null;
                      return (
                        <span
                          key={serviceId}
                          className="rounded-full bg-terracotta/15 px-2 py-0.5 text-xs font-medium text-[#7A4524]"
                        >
                          {service.name}
                        </span>
                      );
                    })}
                  </div>
                  {rowError !== undefined && (
                    <p
                      id={`staff-row-error-${member.id}`}
                      role="alert"
                      className="mt-2 text-xs text-danger"
                    >
                      {rowError}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(member.id)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      dispatch({ type: 'deleteStaff', id: member.id })
                    }
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
    </div>
  );
}
