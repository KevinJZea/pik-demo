'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import {
  emptyDraft,
  guardTargetForStep,
  loadDraft,
  saveDraft,
  wizardReducer,
  type WizardAction,
  type WizardDraft,
} from './wizard-state';

/**
 * Wizard state as an external store (AGENTS.md §13, D11). A module-level
 * singleton — so it survives client-side layout remounts within a session —
 * with two snapshots: the server/first-paint blank draft and, right after
 * hydration, the sessionStorage draft (restore-on-mount, write-through).
 * useSyncExternalStore is the React-blessed shape for this SSR-deferred
 * hydration: no setState-in-effect, no server/client mismatch.
 */

type WizardSnapshot = {
  draft: WizardDraft;
  /** False only until the post-hydration restore (or absence of one) settles. */
  hydrated: boolean;
};

type WizardContextValue = {
  draft: WizardDraft;
  dispatch: (action: WizardAction) => void;
  hydrated: boolean;
};

const WizardContext = createContext<WizardContextValue | null>(null);

// Stable blank identity: getServerSnapshot must return the same object across
// calls during SSR and the hydration pass.
const SERVER_SNAPSHOT: WizardSnapshot = {
  draft: emptyDraft(),
  hydrated: false,
};

let snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function publish(next: WizardSnapshot): void {
  snapshot = next;
  // D11 write-through: only meaningful (and safe) once hydrated, so the
  // initial blank draft can never clobber an existing stored draft.
  if (next.hydrated) saveDraft(next.draft);
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!snapshot.hydrated) {
    // Deferred to a microtask so React finishes the mount commit before the
    // swap render reads the sessionStorage draft — equivalent timing to the
    // classic restore-in-effect, just outside setState.
    queueMicrotask(() => {
      if (snapshot.hydrated) return; // another mount already restored
      const stored = loadDraft();
      publish({ draft: stored ?? emptyDraft(), hydrated: true });
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): WizardSnapshot {
  return snapshot;
}

function getServerSnapshot(): WizardSnapshot {
  return SERVER_SNAPSHOT;
}

function dispatchAction(action: WizardAction): void {
  // The UI only renders after hydration, so this guard is effectively
  // unreachable; keeping it makes the store safe if that ever changes.
  if (!snapshot.hydrated) return;
  publish({
    draft: wizardReducer(snapshot.draft, action),
    hydrated: true,
  });
}

export function WizardProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const wizard = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const value = useMemo<WizardContextValue>(
    () => ({
      draft: wizard.draft,
      dispatch: dispatchAction,
      hydrated: wizard.hydrated,
    }),
    // wizard.draft/hydrated are compared by identity from the module store;
    // only a real publish() produces a new object here.
    [wizard.draft, wizard.hydrated],
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const value = useContext(WizardContext);
  if (value === null) {
    throw new Error(
      'useWizard must be used inside WizardProvider (/register).',
    );
  }
  return value;
}

/**
 * Step-guard hook (§13): returns true once prerequisites for `step` hold and
 * the page may render; otherwise redirects to the first incomplete step.
 * `disabled` suspends the redirect effect only — the summary page passes its
 * `submitting` flag so an intentional leave (success → /register/success)
 * can't be hijacked: the reset it dispatches empties the draft, which would
 * otherwise read as "prerequisites gone" and race the success navigation
 * back to /register. Callsites must keep their hooks above the
 * `if (!ready) return <skeleton>` early return.
 */
export function useStepGuard(step: number, disabled = false): boolean {
  const { draft, hydrated } = useWizard();
  const router = useRouter();
  const target = guardTargetForStep(draft, step);
  // router.replace is an update of an external system (the URL), not a
  // setState call — the effect form is the sanctioned redirect pattern.
  useEffect(() => {
    if (!disabled && hydrated && target !== null) router.replace(target);
  }, [disabled, hydrated, target, router]);
  return hydrated && target === null;
}
