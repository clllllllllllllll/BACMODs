"use client";

import { useSyncExternalStore } from "react";
import { MOCK_DATASET, MOCK_TERM } from "@/lib/mock/dataset";
import { defaultSelectionFor, makeInitialPlan, nextColor } from "@/lib/plan";
import { PlanSchema, type Plan, type SharePayload } from "@/lib/schemas/plan";

/**
 * The student's plan: one small external store, persisted to localStorage on this device.
 * The server and the first client render use the default plan, then the saved one takes over.
 */
const STORAGE_KEY = "bacmods:plan:v1";

const DEFAULT_PLAN: Plan = makeInitialPlan(MOCK_DATASET, MOCK_TERM.intake, MOCK_TERM.term);

let current: Plan = DEFAULT_PLAN;
let loaded = false;
const listeners = new Set<() => void>();

function load(): void {
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = PlanSchema.safeParse(JSON.parse(raw));
    if (parsed.success) current = parsed.data;
  } catch {
    // Storage blocked or corrupt: keep the default plan.
  }
}

function emit(): void {
  listeners.forEach((l) => l());
}

function commit(next: Plan): void {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or quota: the plan still works for this visit.
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Plan {
  if (!loaded) load();
  return current;
}

function getServerSnapshot(): Plan {
  return DEFAULT_PLAN;
}

export const planActions = {
  setSetup(intake: string, term: string) {
    const same = current.intake === intake && current.term === term;
    commit(same ? current : { ...makeInitialPlan(MOCK_DATASET, intake, term), view: current.view });
  },
  pickSection(moduleCode: string, lessonType: string, sectionId: string) {
    commit({
      ...current,
      selection: {
        ...current.selection,
        [moduleCode]: { ...current.selection[moduleCode], [lessonType]: sectionId },
      },
    });
  },
  addModule(code: string) {
    const mod = MOCK_DATASET.modules[code];
    if (!mod || current.added.includes(code) || code in current.colors) return;
    commit({
      ...current,
      added: [...current.added, code],
      colors: { ...current.colors, [code]: nextColor(Object.values(current.colors)) },
      selection: { ...current.selection, [code]: defaultSelectionFor(mod) },
    });
  },
  removeModule(code: string) {
    const { [code]: _color, ...colors } = current.colors;
    const { [code]: _sel, ...selection } = current.selection;
    void _color;
    void _sel;
    commit({ ...current, added: current.added.filter((c) => c !== code), colors, selection });
  },
  setView(view: Plan["view"]) {
    commit({ ...current, view });
  },
  setWeek(week: number) {
    commit({ ...current, week });
  },
  loadShared(payload: SharePayload) {
    commit({ ...current, ...payload });
  },
};

export function usePlan(): Plan {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
