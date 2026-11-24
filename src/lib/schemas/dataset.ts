import { z } from "zod";

/** "HH:MM", Singapore time. */
export const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM");

/** Lesson types seen in the prototype. Real APA values may add more (design.md §8). */
export const LessonTypeSchema = z.string().min(1);

/** 1 = Mon … 6 = Sat. */
export const DaySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const SessionSchema = z.object({
  day: DaySchema,
  start: TimeSchema,
  end: TimeSchema,
  /** null → "Venue TBA". */
  venue: z.string().nullable(),
  /** Teaching-week numbers this session runs in. */
  weeks: z.array(z.number().int().min(1)).min(1),
});

export const SectionSchema = z.object({
  /** Section code within its lesson type, e.g. "ALL", "P3", "Q1". */
  id: z.string().min(1),
  lessonType: LessonTypeSchema,
  /** A section can have several sessions on different weeks. */
  sessions: z.array(SessionSchema).min(1),
});

export const ModuleSchema = z.object({
  /** Normalised: trimmed, uppercase, no spaces. */
  code: z.string().regex(/^[A-Z0-9]+$/),
  title: z.string(),
  credits: z.number().int().nonnegative(),
  /** Empty = in the curriculum but no classes this term. */
  sections: z.array(SectionSchema),
});

export const CalendarSchema = z.object({
  /** ISO date (YYYY-MM-DD) of the Monday of teaching week 1. */
  week1Monday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  teachingWeeks: z.number().int().min(1),
  /** A recess week follows each of these teaching weeks. */
  recessAfterWeeks: z.array(z.number().int().min(1)),
});

export const CurriculumEntrySchema = z.object({
  code: z.string(),
  programme: z.string(),
  intakeAy: z.number().int(),
  year: z.number().int().min(1),
  trimester: z.enum(["T1", "T2", "T3"]),
  kind: z.enum(["mandatory", "elective"]),
});

export const TermDatasetSchema = z.object({
  ay: z.number().int(),
  trimester: z.string(),
  version: z.string(),
  /** ISO date the version was published. */
  publishedOn: z.string(),
  calendar: CalendarSchema,
  modules: z.record(z.string(), ModuleSchema),
  curriculum: z.array(CurriculumEntrySchema),
});

export type Session = z.infer<typeof SessionSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type TermCalendar = z.infer<typeof CalendarSchema>;
export type CurriculumEntry = z.infer<typeof CurriculumEntrySchema>;
export type TermDataset = z.infer<typeof TermDatasetSchema>;
