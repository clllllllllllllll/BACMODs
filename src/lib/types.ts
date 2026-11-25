// Types come from the Zod schemas (docs/AGENT_GUIDE.md §5). Don't hand-write duplicates.
export type {
  CurriculumEntry,
  Module,
  Section,
  Session,
  TermCalendar,
  TermDataset,
} from "@/lib/schemas/dataset";
export type { ModuleColor, Plan, Selection, SharePayload } from "@/lib/schemas/plan";
