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
const DEFAULT_PLAN: Plan = makeInitialPlan(MOCK_DATASET, MOCK_TERM.intake, MOCK_TERM.term);
const SERVER_SNAPSHOT = { plan: DEFAULT_PLAN, loaded: false };
type PlanContext = Pick<Plan, "programme" | "intake" | "term">;

let snapshot = SERVER_SNAPSHOT;
const unsaved = new Map<string, Plan>();
const listeners = new Set<() => void>();

function planKey({ programme, intake, term }: PlanContext): string {
  return `${PLAN_PREFIX}${JSON.stringify([programme, intake, term])}`;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readPlan(key: string): Plan | undefined {
  const raw = read(key);
  if (raw === null) return;
  try {
    const parsed = PlanSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // Ignore damaged records and keep the rest of the store usable.
  }
}

function persist(plan: Plan): void {
  const key = planKey(plan);
  try {
    window.localStorage.setItem(key, JSON.stringify(plan));
    window.localStorage.setItem(ACTIVE_KEY, key);
    unsaved.delete(key);
  } catch {
    // Keep switches usable for this visit even if storage is blocked or full.
    unsaved.set(key, plan);
  }
}

function getSnapshot() {
  if (!snapshot.loaded) {
    const activeKey = read(ACTIVE_KEY);
    const stored = activeKey?.startsWith(PLAN_PREFIX) ? readPlan(activeKey) : undefined;
    if (stored && planKey(stored) === activeKey) {
      snapshot = { plan: stored, loaded: true };
    } else {
      const legacy = readPlan(LEGACY_KEY);
      if (legacy) persist(legacy);
      snapshot = { plan: legacy ?? DEFAULT_PLAN, loaded: true };
    }
  }
  return snapshot;
}

function findPlan(context: PlanContext): Plan {
  const { plan } = getSnapshot();
  const key = planKey(context);
  if (key === planKey(plan)) return plan;
  return unsaved.get(key) ?? readPlan(key) ?? {
    ...makeInitialPlan(MOCK_DATASET, context.intake, context.term),
    programme: context.programme,
    view: plan.view,
  };
}

function commit(plan: Plan): void {
  snapshot = { plan, loaded: true };
  persist(plan);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const planActions = {
  setSetup(intake: string, term: string) {
    const { plan } = getSnapshot();
    commit(findPlan({ programme: plan.programme, intake, term }));
  },
  pickSection(moduleCode: string, lessonType: string, sectionId: string) {
    const { plan } = getSnapshot();
    commit({
      ...plan,
      selection: {
        ...plan.selection,
        [moduleCode]: { ...plan.selection[moduleCode], [lessonType]: sectionId },
      },
    });
  },
  addModule(code: string) {
    const { plan } = getSnapshot();
    const mod = MOCK_DATASET.modules[code];
    if (!mod || planCodes(plan, MOCK_DATASET).includes(code)) return;
    commit({
      ...plan,
      added: [...plan.added, code],
      colors: { ...plan.colors, [code]: plan.colors[code] ?? nextColor(Object.values(plan.colors)) },
      selection: { ...plan.selection, [code]: defaultSelectionFor(mod) },
    });
  },
  removeModule(code: string) {
    const { plan } = getSnapshot();
    const { [code]: _color, ...colors } = plan.colors;
    const { [code]: _sel, ...selection } = plan.selection;
    void _color;
    void _sel;
    commit({ ...plan, added: plan.added.filter((c) => normalizeModuleCode(c) !== code), colors, selection });
  },
  setView(view: Plan["view"]) {
    commit({ ...getSnapshot().plan, view });
  },
  setWeek(week: number) {
    commit({ ...getSnapshot().plan, week });
  },
  loadShared(payload: SharePayload) {
    commit({ ...findPlan(payload), ...payload });
  },
};

export function usePlanState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

export function usePlan(): Plan {
  return usePlanState().plan;
}
