'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import type { Appointment, Business, TimeSlot } from '@/types/domain';
import {
  createAppointment,
  getAvailability,
  getBusinessBySlug,
  PikApiError,
} from '@/lib/api';
import { createAppointmentSchema, zodIssues } from '@/lib/schemas';
import { ErrorPanel, Stepper } from '@/components/ui';
import {
  BookingLoading,
  BookingSuccess,
  BookingSummary,
  DateStrip,
  ServicePicker,
  SlotGrid,
  StaffPicker,
  bookingWindow,
  isClosedOn,
} from './index';

export type BookingWizardProps = {
  slug: string;
};

const STEPS = ['Servicio', 'Especialista', 'Horario', 'Confirmar'] as const;

/** Fake payment delay before the POST (§13): "Confirmar y pagar" spinner. */
const PAYMENT_MS = 1200;

type ConfirmInput = { customerName: string; customerPhone: string };

/**
 * Booking wizard orchestrator (§13). All selections live in the URL
 * (service/staff/date/time); the visible step is derived from them, so
 * browser back/forward and refreshes behave for free. Data comes from the
 * Route Handlers via `lib/api` — never from the store or mocks.
 */
export function BookingWizard({ slug }: BookingWizardProps): ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceParam = searchParams.get('service') ?? undefined;
  const staffParam = searchParams.get('staff') ?? undefined;
  const dateParam = searchParams.get('date') ?? undefined;
  const timeParam = searchParams.get('time') ?? undefined;

  // --- business fetch ------------------------------------------------------
  // Keyed single state: a retry (nonce bump) shows the skeleton again instead
  // of a stale error, and no setState runs synchronously inside the effect
  // (React Compiler lint rule).
  const [businessState, setBusinessState] = useState<
    | { status: 'loading' }
    | { status: 'ok'; key: string; business: Business }
    | { status: 'error'; key: string; error: PikApiError }
  >({ status: 'loading' });
  const [businessNonce, setBusinessNonce] = useState(0);
  const businessKey = `${slug}|${businessNonce}`;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const fetched = await getBusinessBySlug(slug);
        if (!cancelled) {
          setBusinessState({
            status: 'ok',
            key: businessKey,
            business: fetched,
          });
        }
      } catch (error) {
        // api.ts already maps every failure shape (network, non-JSON body,
        // error envelope) to PikApiError, so that is the only type to handle.
        const apiError =
          error instanceof PikApiError
            ? error
            : new PikApiError(
                0,
                'Algo salió mal. Inténtalo de nuevo en unos momentos.',
              );
        if (!cancelled) {
          setBusinessState({
            status: 'error',
            key: businessKey,
            error: apiError,
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, businessKey]);

  const business =
    businessState.status === 'ok' && businessState.key === businessKey
      ? businessState.business
      : null;
  const businessError =
    businessState.status === 'error' && businessState.key === businessKey
      ? businessState.error
      : null;

  // --- availability fetch ----------------------------------------------------

  const [slotsState, setSlotsState] = useState<{
    key: string;
    slots: TimeSlot[];
    error: string | null;
  } | null>(null);
  const [slotsNonce, setSlotsNonce] = useState(0);
  const slotsKey = `${slug}|${serviceParam ?? ''}|${staffParam ?? ''}|${dateParam ?? ''}|${slotsNonce}`;
  const slotsLoading =
    serviceParam !== undefined &&
    staffParam !== undefined &&
    dateParam !== undefined &&
    (slotsState === null || slotsState.key !== slotsKey);
  const slotsError =
    slotsState !== null &&
    slotsState.key === slotsKey &&
    slotsState.error !== null
      ? slotsState.error
      : null;

  useEffect(() => {
    if (
      serviceParam === undefined ||
      staffParam === undefined ||
      dateParam === undefined
    ) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const slots = await getAvailability({
          business: slug,
          service: serviceParam,
          staff: staffParam,
          date: dateParam,
        });
        if (!cancelled) {
          setSlotsState({ key: slotsKey, slots, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setSlotsState({
            key: slotsKey,
            slots: [],
            error:
              error instanceof PikApiError
                ? error.message
                : 'Algo salió mal. Inténtalo de nuevo en unos momentos.',
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, serviceParam, staffParam, dateParam, slotsKey]);

  // --- confirm-flow state ----------------------------------------------------

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    customerName?: string;
    customerPhone?: string;
  }>({});
  const [lastInput, setLastInput] = useState<ConfirmInput | null>(null);
  const [confirmError, setConfirmError] = useState<{
    status: number;
    message: string;
  } | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // --- URL param resolution + step derivation ---------------------------------

  const service = business?.services.find((s) => s.id === serviceParam);
  const staffMember =
    staffParam !== undefined && staffParam !== 'any'
      ? business?.staff.find((s) => s.id === staffParam)
      : undefined;
  const timeRaw = timeParam === undefined ? Number.NaN : Number(timeParam);
  const startMinParam =
    Number.isInteger(timeRaw) && timeRaw >= 0 ? timeRaw : undefined;

  const step = (() => {
    if (business === null) return 0; // loading / global error — no step UI
    if (service === undefined) return 1;
    if (
      staffParam === undefined ||
      (staffParam !== 'any' && staffMember === undefined)
    ) {
      return 2;
    }
    if (dateParam === undefined || startMinParam === undefined) return 3;
    return 4;
  })();

  /** URL is the single source of truth: every action writes search params. */
  const navigate = useCallback(
    (
      next: { service?: string; staff?: string; date?: string; time?: string },
      mode: 'push' | 'replace' = 'push',
    ) => {
      const params = new URLSearchParams();
      if (next.service !== undefined) params.set('service', next.service);
      if (next.staff !== undefined) params.set('staff', next.staff);
      if (next.date !== undefined) params.set('date', next.date);
      if (next.time !== undefined) params.set('time', next.time);
      const query = params.toString();
      const url = `/b/${slug}/book${query === '' ? '' : `?${query}`}`;
      if (mode === 'replace') router.replace(url);
      else router.push(url);
    },
    [router, slug],
  );

  // Step 3 default date (§13): today if open, else the next open day in the
  // 14-day window. replace() so the injected default doesn't pollute history.
  useEffect(() => {
    if (
      business === null ||
      service === undefined ||
      staffParam === undefined
    ) {
      return;
    }
    if (dateParam !== undefined || step !== 3) return;
    // Weekly hours recur within any 14-day span, so a valid business always
    // has at least one open day here.
    const firstOpen = bookingWindow().find(
      (date) => !isClosedOn(business.hours, date),
    );
    if (firstOpen !== undefined) {
      navigate(
        { service: service.id, staff: staffParam, date: firstOpen },
        'replace',
      );
    }
  }, [business, service, staffParam, dateParam, step, navigate]);

  const confirm = useCallback(
    async (input: ConfirmInput) => {
      setSubmitting(true);
      setConfirmError(null);
      // Kept so the 500 path's "Reintentar" can re-POST the same payload.
      setLastInput(input);
      // Fake payment first (§13), then the real POST — the server re-runs
      // every domain check no matter what the client already validated.
      await new Promise((resolve) => setTimeout(resolve, PAYMENT_MS));
      try {
        const appointment = await createAppointment({
          businessSlug: slug,
          serviceId: serviceParam ?? '',
          staffId: staffParam ?? '',
          date: dateParam ?? '',
          startMin: startMinParam ?? -1,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
        });
        setConfirmed(appointment);
      } catch (error) {
        setConfirmError({
          status: error instanceof PikApiError ? error.status : 0,
          message:
            error instanceof PikApiError
              ? error.message
              : 'Algo salió mal. Inténtalo de nuevo en unos momentos.',
        });
      } finally {
        setSubmitting(false);
      }
    },
    [slug, serviceParam, staffParam, dateParam, startMinParam],
  );

  const retryConfirm = useCallback(() => {
    if (lastInput !== null) void confirm(lastInput);
  }, [confirm, lastInput]);

  // --- step actions -----------------------------------------------------------

  const clearConflict = () => {
    if (conflictMessage !== null) setConflictMessage(null);
  };

  const pickService = (id: string) => {
    clearConflict();
    // Re-picking the current service means "return to the flow" (downstream
    // selections kept); a different service invalidates staff/date/time.
    if (id === serviceParam) {
      navigate({
        service: id,
        staff: staffParam,
        date: dateParam,
        time: timeParam,
      });
    } else {
      navigate({ service: id });
    }
  };

  const pickStaff = (id: string) => {
    clearConflict();
    if (id === staffParam) {
      navigate({
        service: serviceParam,
        staff: id,
        date: dateParam,
        time: timeParam,
      });
    } else {
      // Availability is per-staff: a different specialist resets date/time.
      navigate({ service: serviceParam, staff: id });
    }
  };

  const pickDate = (date: string) => {
    clearConflict();
    navigate({ service: serviceParam, staff: staffParam, date });
  };

  const pickSlot = (start: number) => {
    clearConflict();
    navigate({
      service: serviceParam,
      staff: staffParam,
      date: dateParam,
      time: String(start),
    });
  };

  // Stepper back-navigation (§13: only completed steps are clickable).
  const stepBack = (index: number) => {
    clearConflict();
    if (index <= 0) navigate({});
    else if (index === 1) navigate({ service: serviceParam });
    else {
      navigate({
        service: serviceParam,
        staff: staffParam,
        ...(dateParam !== undefined ? { date: dateParam } : {}),
      });
    }
  };

  const onSummarySubmit = (input: ConfirmInput) => {
    setAttemptedSubmit(true);
    // Client pre-parse mirrors the server body schema; of its fields only the
    // two customer fields can fail here (the rest come from the URL).
    const payload = {
      businessSlug: slug,
      serviceId: serviceParam ?? '',
      staffId: staffParam ?? '',
      date: dateParam ?? '',
      startMin: startMinParam ?? -1,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
    };
    const parsed = createAppointmentSchema.safeParse(payload);
    if (!parsed.success) {
      const next: { customerName?: string; customerPhone?: string } = {};
      for (const issue of zodIssues(parsed.error)) {
        if (issue.path === 'customerName') next.customerName = issue.message;
        if (issue.path === 'customerPhone') next.customerPhone = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    void confirm(input);
  };

  // 400 at confirm time = stale domain state (closed day, past slot, past
  // close): the only meaningful retry is re-checking slots at step 3.
  const backToSlots = () => {
    setConfirmError(null);
    setSlotsNonce((n) => n + 1);
    navigate({ service: serviceParam, staff: staffParam, date: dateParam });
  };

  // --- success (ephemeral client state — refresh returns to step 4, §15) ------

  if (confirmed !== null && business !== null) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pt-6 pb-12">
        <BookingSuccess
          business={business}
          appointment={confirmed}
          onDone={() => router.push(`/b/${slug}`)}
        />
      </div>
    );
  }

  // --- global states: business loading / error ---------------------------------

  if (business === null) {
    if (businessError !== null && businessError.status === 404) {
      // States matrix (§13): 404 business → message + home link.
      return (
        <div className="mx-auto w-full max-w-md px-4 pt-6 pb-12">
          <div className="rounded-2xl border border-line bg-card px-6 py-10 text-center">
            <h1 className="font-display text-xl font-semibold text-espresso">
              Negocio no encontrado.
            </h1>
            <p className="mt-2 text-sm text-taupe">
              El negocio que buscas ya no está disponible en la demo.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-plum px-5 text-sm font-medium text-white transition-colors hover:bg-plum-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      );
    }
    if (businessError !== null) {
      return (
        <div className="mx-auto w-full max-w-md px-4 pt-6 pb-12">
          <ErrorPanel
            message={businessError.message}
            onRetry={() => setBusinessNonce((n) => n + 1)}
          />
        </div>
      );
    }
    return <BookingLoading />;
  }

  // --- steps --------------------------------------------------------------------

  const headingClasses =
    'font-display text-xl font-semibold text-espresso focus:outline-none';

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-6 pb-12">
      <h1 className="font-display text-2xl font-semibold text-espresso">
        Reserva en {business.name}
      </h1>
      <Stepper
        steps={STEPS}
        current={step - 1}
        onStepClick={stepBack}
        className="mt-4"
      />

      {step === 1 && (
        <section className="mt-6">
          <h2 autoFocus tabIndex={-1} className={headingClasses}>
            Elige un servicio
          </h2>
          <ServicePicker
            services={business.services}
            selectedId={serviceParam}
            onSelect={pickService}
            className="mt-4"
          />
        </section>
      )}

      {step === 2 && service !== undefined && (
        <section className="mt-6">
          <h2 autoFocus tabIndex={-1} className={headingClasses}>
            Elige a tu especialista
          </h2>
          <p className="mt-1 text-sm text-taupe">
            Para {service.name} · {service.durationMin} min.
          </p>
          <StaffPicker
            service={service}
            staff={business.staff}
            services={business.services}
            selectedStaff={staffParam}
            onSelect={pickStaff}
            onBackToServices={() => navigate({})}
            className="mt-4"
          />
        </section>
      )}

      {step === 3 && service !== undefined && staffParam !== undefined && (
        <section className="mt-6">
          <h2 autoFocus tabIndex={-1} className={headingClasses}>
            Elige fecha y hora
          </h2>
          {/* 409 recovery (§13): message + step-3 re-entry keeping the date;
              the nonce bump makes SlotGrid refetch so the taken slot clears. */}
          {conflictMessage !== null && (
            <ErrorPanel message={conflictMessage} className="mt-4" />
          )}
          <DateStrip
            hours={business.hours}
            selected={dateParam}
            onSelect={pickDate}
            className="mt-4"
          />
          {slotsError === null ? (
            <div className="mt-4">
              <SlotGrid
                slots={slotsLoading ? null : (slotsState?.slots ?? null)}
                closed={
                  dateParam !== undefined
                    ? isClosedOn(business.hours, dateParam)
                    : false
                }
                selected={startMinParam}
                onSelect={pickSlot}
              />
            </div>
          ) : (
            <ErrorPanel
              message={slotsError}
              onRetry={() => setSlotsNonce((n) => n + 1)}
              className="mt-4"
            />
          )}
        </section>
      )}

      {step === 4 &&
        service !== undefined &&
        staffParam !== undefined &&
        dateParam !== undefined &&
        startMinParam !== undefined && (
          <section className="mt-6">
            <h2 autoFocus tabIndex={-1} className={headingClasses}>
              Confirma tu reserva
            </h2>
            {confirmError !== null && (
              <div className="mt-4 flex flex-col gap-2.5">
                <ErrorPanel
                  message={confirmError.message}
                  onRetry={lastInput === null ? undefined : retryConfirm}
                />
                {confirmError.status === 400 && (
                  <button
                    type="button"
                    onClick={backToSlots}
                    className="text-sm font-medium text-plum hover:underline"
                  >
                    Ver horarios disponibles
                  </button>
                )}
              </div>
            )}
            <BookingSummary
              service={service}
              staff={staffMember}
              date={dateParam}
              startMin={startMinParam}
              fieldErrors={attemptedSubmit ? fieldErrors : {}}
              submitting={submitting}
              onConfirm={(customerName, customerPhone) =>
                onSummarySubmit({ customerName, customerPhone })
              }
              className="mt-4"
            />
          </section>
        )}
    </div>
  );
}
