import { curriculumCodes, defaultSelectionFor, nextColor, normalizeModuleCode, planCodes } from "@/lib/plan";
import type { TermDataset } from "@/lib/schemas/dataset";
import type { Plan } from "@/lib/schemas/plan";

export type PlanEdit = (plan: Plan) => Plan;

export function pickSection(
  plan: Plan,
  dataset: TermDataset,
  moduleCode: string,
  lessonType: string,
  sectionId: string,
): Plan {
  const code = normalizeModuleCode(moduleCode);
  // The module could have been removed in another tab since this choice was displayed.
  if (!planCodes(plan, dataset).includes(code) || plan.selection[code]?.[lessonType] === sectionId) return plan;
  return {
    ...plan,
    selection: {
      ...plan.selection,
      [code]: { ...plan.selection[code], [lessonType]: sectionId },
    },
  };
}

export function addModule(plan: Plan, dataset: TermDataset, moduleCode: string): Plan {
  const code = normalizeModuleCode(moduleCode);
  if (!Object.hasOwn(dataset.modules, code) || planCodes(plan, dataset).includes(code)) return plan;
  return {
    ...plan,
    added: [...plan.added, code],
    colors: { ...plan.colors, [code]: plan.colors[code] ?? nextColor(Object.values(plan.colors)) },
    selection: { ...plan.selection, [code]: defaultSelectionFor(dataset.modules[code]) },
  };
}

export function removeModule(plan: Plan, dataset: TermDataset, moduleCode: string): Plan {
  const code = normalizeModuleCode(moduleCode);
  const added = plan.added.filter((entry) => normalizeModuleCode(entry) !== code);
  if (added.length === plan.added.length) return plan;

  const curriculum = curriculumCodes(plan, dataset);
  if (curriculum && Object.values(curriculum).some((group) => group.includes(code))) return plan;

  const colors = { ...plan.colors };
  const selection = { ...plan.selection };
  delete colors[code];
  delete selection[code];
  return { ...plan, added, colors, selection };
}

export function setView(plan: Plan, view: Plan["view"]): Plan {
  return plan.view === view ? plan : { ...plan, view };
}

export function stepWeek(plan: Plan, step: -1 | 1, lastWeek: number): Plan {
  const currentWeek = Math.min(plan.week, lastWeek);
  const week = Math.min(lastWeek, Math.max(1, currentWeek + step));
  return week === plan.week ? plan : { ...plan, week };
}

export function replayEdits(plan: Plan, edits: readonly PlanEdit[]): Plan {
  return edits.reduce((current, apply) => apply(current), plan);
}
