"use client";

import { useSyncExternalStore } from "react";
import { MOCK_DATASET, MOCK_TERM } from "@/lib/mock/dataset";
import { defaultSelectionFor, makeInitialPlan, nextColor, normalizeModuleCode, planCodes } from "@/lib/plan";
import { PlanSchema, type Plan, type SharePayload } from "@/lib/schemas/plan";

/**
 * Keep a separate localStorage record for each programme, intake and term, plus an active pointer.
 * The server and the first client render use the default snapshot until storage is read.
 */
const LEGACY_KEY = "bacmods:plan:v1";
const PLAN_PREFIX = "bacmods:plan:v2:";
const ACTIVE_KEY = `${PLAN_PREFIX}active`;
const WRITE_DB = "bacmods:plan-lock";
const WRITE_STORE = "writes";
const DEFAULT_PLAN: Plan = makeInitialPlan(MOCK_DATASET, MOCK_TERM.intake, MOCK_TERM.term);
const SERVER_SNAPSHOT = { plan: DEFAULT_PLAN, loaded: false };
type PlanContext = Pick<Plan, "programme" | "intake" | "term">;
type Edit = (plan: Plan) => Plan;

let snapshot = SERVER_SNAPSHOT;
let writeDb: Promise<IDBDatabase> | undefined;
const unsaved = new Map<string, { base: Plan; edits: Edit[] }>();
const listeners = new Set<() => void>();

function planKey({ programme, intake, term }: PlanContext): string {
  return `${PLAN_PREFIX}${JSON.stringify([programme, intake, term])}`;
}

function read(key: string): string | null | undefined {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return undefined;
  }
}

function write(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function parsePlan(raw: string | null | undefined): Plan | undefined {
  if (raw == null) return;
  try {
    const parsed = PlanSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // Ignore damaged records and keep the rest of the store usable.
  }
}

function contextPlan(key: string, raw: string | null | undefined): Plan | undefined {
  const plan = parsePlan(raw);
  return plan && planKey(plan) === key ? plan : undefined;
}

function activePlan(): Plan | undefined {
  const key = read(ACTIVE_KEY);
  return key?.startsWith(PLAN_PREFIX) ? contextPlan(key, read(key)) : undefined;
}

function getSnapshot() {
  if (!snapshot.loaded) {
    const stored = activePlan();
    const fallback = stored ?? parsePlan(read(LEGACY_KEY)) ?? DEFAULT_PLAN;
    const key = planKey(fallback);
    snapshot = { plan: stored ?? contextPlan(key, read(key)) ?? fallback, loaded: true };
  }
  return snapshot;
}

function initialPlan(context: PlanContext, view: Plan["view"]): Plan {
  const legacy = parsePlan(read(LEGACY_KEY));
  if (legacy && planKey(legacy) === planKey(context)) return legacy;
  return {
    ...makeInitialPlan(MOCK_DATASET, context.intake, context.term),
    programme: context.programme,
    view,
  };
}

function publish(plan: Plan): void {
  if (snapshot.plan === plan) return;
  snapshot = { plan, loaded: true };
  listeners.forEach((listener) => listener());
}

function openWriteDb(): Promise<IDBDatabase> {
  writeDb ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(WRITE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(WRITE_STORE);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      db.onclose = () => { writeDb = undefined; };
      db.onversionchange = () => {
        db.close();
        writeDb = undefined;
      };
      resolve(db);
    };
  }).catch((error: unknown) => {
    writeDb = undefined;
    throw error;
  });
  return writeDb;
}

/** Read and write localStorage inside a readwrite transaction to serialize edits across tabs. */
async function withWriteLock(work: (locked: boolean) => void): Promise<void> {
  let acquired = false;
  try {
    const db = await openWriteDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(WRITE_STORE, "readwrite");
      transaction.onabort = () => reject(transaction.error);
      // The store stays empty. A request puts the callback inside this transaction's turn.
      const request = transaction.objectStore(WRITE_STORE).get(0);
      request.onsuccess = () => {
        acquired = true;
        try {
          work(true);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
    });
    return;
  } catch (error) {
    if (acquired) throw error;
  }
  // Without a lock, keep the edits in memory instead of risking an unsafe write.
  work(false);
}

function migrateLegacy(): void {
  const legacy = parsePlan(read(LEGACY_KEY));
  if (!legacy || activePlan()) return;
  void withWriteLock((locked) => {
    if (!locked || activePlan()) return;
    const key = planKey(legacy);
    const raw = read(key);
    if (raw !== undefined && (contextPlan(key, raw) || write(key, JSON.stringify(legacy)))) {
      write(ACTIVE_KEY, key);
    }
  });
}

function changePlan(context: PlanContext, edit?: Edit, activate = false): Promise<void> {
  const displayed = getSnapshot().plan;
  const key = planKey(context);
  return withWriteLock((locked) => {
    const raw = read(key);
    const pending = unsaved.get(key);
    const now = getSnapshot().plan;
    const fallback = [now, displayed].find((plan) => planKey(plan) === key);
    const base = contextPlan(key, raw) ?? pending?.base ?? fallback ?? initialPlan(context, displayed.view);
    const edits = pending?.edits ?? [];
    const current = edits.reduce((plan, apply) => apply(plan), base);
    const next = edit ? edit(current) : current;
    const nextEdits = edit && next !== current ? [...edits, edit] : edits;

    if (activate || nextEdits.length > 0) {
      if (locked && raw !== undefined && write(key, JSON.stringify(next))) {
        unsaved.delete(key);
        if (activate) write(ACTIVE_KEY, key);
      } else {
        // Replay unsaved edits on the latest stored plan if persistence becomes available again.
        unsaved.set(key, { base, edits: nextEdits });
      }
    }
    if (activate || planKey(now) === key) publish(next);
  });
}

function editDisplayed(edit: Edit): Promise<void> {
  return changePlan(getSnapshot().plan, edit);
}

function syncDisplayed(): void {
  const key = planKey(getSnapshot().plan);
  const stored = contextPlan(key, read(key));
  if (!stored) return;
  const pending = unsaved.get(key);
  if (pending) pending.base = stored;
  const plan = pending?.edits.reduce((current, apply) => apply(current), stored) ?? stored;
  if (JSON.stringify(plan) !== JSON.stringify(snapshot.plan)) publish(plan);
}

function onStorage(event: StorageEvent): void {
  if (event.key !== planKey(getSnapshot().plan)) return;
  try {
    if (event.storageArea !== window.localStorage) return;
  } catch {
    return;
  }
  syncDisplayed();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
    syncDisplayed();
    migrateLegacy();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export const planActions = {
  setSetup(intake: string, term: string) {
    const { plan } = getSnapshot();
    return changePlan({ programme: plan.programme, intake, term }, undefined, true);
  },
  pickSection(moduleCode: string, lessonType: string, sectionId: string) {
    return editDisplayed((plan) => {
      // The module could have been removed in another tab since this choice was displayed.
      if (!planCodes(plan, MOCK_DATASET).includes(moduleCode)) return plan;
      return {
        ...plan,
        selection: {
          ...plan.selection,
          [moduleCode]: { ...plan.selection[moduleCode], [lessonType]: sectionId },
        },
      };
    });
  },
  addModule(code: string) {
    return editDisplayed((plan) => {
      const mod = MOCK_DATASET.modules[code];
      if (!mod || planCodes(plan, MOCK_DATASET).includes(code)) return plan;
      return {
        ...plan,
        added: [...plan.added, code],
        colors: { ...plan.colors, [code]: plan.colors[code] ?? nextColor(Object.values(plan.colors)) },
        selection: { ...plan.selection, [code]: defaultSelectionFor(mod) },
      };
    });
  },
  removeModule(code: string) {
    return editDisplayed((plan) => {
      const added = plan.added.filter((c) => normalizeModuleCode(c) !== code);
      if (added.length === plan.added.length) return plan;
      const colors = { ...plan.colors };
      const selection = { ...plan.selection };
      delete colors[code];
      delete selection[code];
      return { ...plan, added, colors, selection };
    });
  },
  setView(view: Plan["view"]) {
    return editDisplayed((plan) => plan.view === view ? plan : { ...plan, view });
  },
  stepWeek(step: -1 | 1) {
    return editDisplayed((plan) => {
      const lastWeek = MOCK_DATASET.calendar.teachingWeeks;
      const week = Math.min(plan.week, lastWeek) + step;
      return week < 1 || week > lastWeek ? plan : { ...plan, week };
    });
  },
  loadShared(payload: SharePayload) {
    return changePlan(payload, (plan) => ({ ...plan, ...payload }), true);
  },
};

export function usePlanState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

export function usePlan(): Plan {
  return usePlanState().plan;
}
