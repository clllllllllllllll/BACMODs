import { z } from "zod";

/** Module accent colours in assignment order (design.md §2). */
export const MODULE_COLORS = ["blue", "purple", "green", "orange", "pink", "teal", "slate"] as const;
export const ModuleColorSchema = z.enum(MODULE_COLORS);

/** moduleCode → lessonType → section id. */
export const SelectionSchema = z.record(z.string(), z.record(z.string(), z.string()));

export const PlanSchema = z.object({
  programme: z.literal("BAC"),
  /** Intake academic year, e.g. "AY26". */
  intake: z.string(),
  /** Year of study + term, e.g. "Y1T2". */
  term: z.string(),
  /** Modules the student added that are not on their curriculum list. */
  added: z.array(z.string()),
  selection: SelectionSchema,
  /** Stored with the plan so a module keeps its colour (design.md §2). */
  colors: z.record(z.string(), ModuleColorSchema),
  /** "auto" follows the screen: Week on desktop, Day elsewhere, until the student picks one. */
  view: z.enum(["auto", "day", "week"]),
  week: z.number().int().min(1),
});

/** What a share code carries: no personal data. */
export const SharePayloadSchema = PlanSchema.pick({
  programme: true,
  intake: true,
  term: true,
  added: true,
  selection: true,
  colors: true,
});

export type ModuleColor = z.infer<typeof ModuleColorSchema>;
export type Selection = z.infer<typeof SelectionSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type SharePayload = z.infer<typeof SharePayloadSchema>;
