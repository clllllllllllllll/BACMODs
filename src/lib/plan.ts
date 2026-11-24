import type { Module, Section, Session, TermDataset } from "@/lib/schemas/dataset";
import { MODULE_COLORS, type ModuleColor, type Plan, type Selection } from "@/lib/schemas/plan";
import { clashingIndexes, sessionsClash } from "@/lib/clash";
import { toMinutes } from "@/lib/time";

export interface PlannedSession {
  moduleCode: string;
  color: ModuleColor;
  lessonType: string;
  sectionId: string;
  session: Session;
}

/** Lesson types of a module, in the order they first appear. */
export function lessonTypesOf(module: Module): string[] {
  return [...new Set(module.sections.map((s) => s.lessonType))];
}

export function sectionsOfType(module: Module, lessonType: string): Section[] {
  return module.sections.filter((s) => s.lessonType === lessonType);
}

/** Only one section exists → fixed (lock icon). */
export function isFixed(module: Module, lessonType: string): boolean {
  return sectionsOfType(module, lessonType).length === 1;
}

export function hasChoice(module: Module): boolean {
  return lessonTypesOf(module).some((t) => !isFixed(module, t));
}

/** First section of every lesson type: the starting point for a module. */
export function defaultSelectionFor(module: Module): Record<string, string> {
  const out: Record<string, string> = {};
  for (const type of lessonTypesOf(module)) out[type] = sectionsOfType(module, type)[0].id;
  return out;
}

/** First colour not yet used; from the eighth module the order starts again (design.md §2). */
export function nextColor(used: ModuleColor[]): ModuleColor {
  const free = MODULE_COLORS.find((c) => !used.includes(c));
  return free ?? MODULE_COLORS[used.length % MODULE_COLORS.length];
}

/** Module codes on the student's curriculum list for the plan's term, in display order. */
export function curriculumCodes(
  plan: Plan,
  dataset: TermDataset,
): { choice: string[]; fixed: string[]; optional: string[] } {
  const trimester = plan.term.slice(2); // "Y1T2" → "T2"
  const year = Number(plan.term[1]);
  const entries = dataset.curriculum.filter((c) => c.year === year && c.trimester === trimester);
  const mandatory = entries.filter((c) => c.kind === "mandatory").map((c) => c.code);
  const optional = entries.filter((c) => c.kind === "elective").map((c) => c.code);
  const known = (code: string) => code in dataset.modules;
  return {
    choice: mandatory.filter((c) => known(c) && hasChoice(dataset.modules[c])),
    fixed: mandatory.filter((c) => known(c) && !hasChoice(dataset.modules[c])),
    optional: optional.filter(known),
  };
}

/** Every module in the plan: curriculum groups first, then added ones. */
export function planCodes(plan: Plan, dataset: TermDataset): string[] {
  const c = curriculumCodes(plan, dataset);
  return [...c.choice, ...c.fixed, ...c.optional, ...plan.added.filter((a) => a in dataset.modules)];
}

export function makeInitialPlan(dataset: TermDataset, intake: string, term: string): Plan {
  const base: Plan = {
    programme: "BAC",
    intake,
    term,
    added: [],
    selection: {},
    colors: {},
    view: "day",
    week: 1,
  };
  const used: ModuleColor[] = [];
  const selection: Selection = {};
  const colors: Record<string, ModuleColor> = {};
  for (const code of planCodes(base, dataset)) {
    const color = nextColor(used);
    used.push(color);
    colors[code] = color;
    selection[code] = defaultSelectionFor(dataset.modules[code]);
  }
  return { ...base, selection, colors };
}

/** Chosen section for a lesson type; fixed types resolve without a stored pick. */
export function chosenSection(plan: Plan, module: Module, lessonType: string): Section | undefined {
  const options = sectionsOfType(module, lessonType);
  if (options.length === 1) return options[0];
  const id = plan.selection[module.code]?.[lessonType];
  return options.find((s) => s.id === id);
}

/** All sessions of the chosen sections, ready for the timetable views. */
export function plannedSessions(plan: Plan, dataset: TermDataset): PlannedSession[] {
  const out: PlannedSession[] = [];
  for (const code of planCodes(plan, dataset)) {
    const mod = dataset.modules[code];
    for (const lessonType of lessonTypesOf(mod)) {
      const section = chosenSection(plan, mod, lessonType);
      if (!section) continue;
      for (const session of section.sessions) {
        out.push({
          moduleCode: code,
          color: plan.colors[code] ?? "slate",
          lessonType,
          sectionId: section.id,
          session,
        });
      }
    }
  }
  return out;
}

/** Clashes among the chosen sections (any week). */
export function planClashes(
  plan: Plan,
  dataset: TermDataset,
): { count: number; indexes: Set<number>; items: PlannedSession[] } {
  const items = plannedSessions(plan, dataset);
  const indexes = clashingIndexes(items);
  let count = 0;
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) if (sessionsClash(items[i].session, items[j].session)) count++;
  return { count, indexes, items };
}

/** Would these sessions clash with the chosen sections of the rest of the plan? */
export function clashesWithPlan(
  sessions: Session[],
  plan: Plan,
  dataset: TermDataset,
  ignore: { moduleCode: string; lessonType?: string },
): boolean {
  return plannedSessions(plan, dataset).some(
    (p) =>
      !(
        p.moduleCode === ignore.moduleCode &&
        (ignore.lessonType === undefined || p.lessonType === ignore.lessonType)
      ) && sessions.some((s) => sessionsClash(s, p.session)),
  );
}

export interface PlanSummary {
  credits: number;
  daysOnCampus: number;
  earliestStart: string | null;
  clashes: number;
}

export function summarise(plan: Plan, dataset: TermDataset): PlanSummary {
  const { count, items } = planClashes(plan, dataset);
  const starts = items.map((i) => i.session.start).sort((a, b) => toMinutes(a) - toMinutes(b));
  return {
    credits: planCodes(plan, dataset).reduce((sum, c) => sum + dataset.modules[c].credits, 0),
    daysOnCampus: new Set(items.map((i) => i.session.day)).size,
    earliestStart: starts[0] ?? null,
    clashes: count,
  };
}

/** One line per module: "INF1107 LEC ALL · LAB P3 · QUIZ Q1". */
export function sectionListLines(plan: Plan, dataset: TermDataset): { code: string; line: string }[] {
  return planCodes(plan, dataset).map((code) => {
    const mod = dataset.modules[code];
    const parts = lessonTypesOf(mod)
      .map((t) => chosenSection(plan, mod, t))
      .filter((s): s is Section => Boolean(s))
      .map((s) => `${s.lessonType} ${s.id}`);
    return { code, line: `${code} ${parts.join(" · ")}` };
  });
}

/** Saturday sessions add a Sat tab and column (design.md §7). */
export function hasSaturday(items: PlannedSession[]): boolean {
  return items.some((i) => i.session.day === 6);
}
