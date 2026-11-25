// Class types from design.md §8. Confirm against the APA timetable before relying on them.
const NAMES: Record<string, string> = {
  LEC: "Lecture",
  LTR: "Lectorial",
  TUT: "Tutorial",
  LAB: "Laboratory",
  QUIZ: "Quiz",
  WKS: "Workshop",
};

/** "LAB" → "Laboratory". Unknown types fall back to the raw value. */
export function lessonTypeName(lessonType: string): string {
  return NAMES[lessonType] ?? lessonType;
}

/** "LAB", "P3" → "LAB P3" (chips, week blocks, section lists). */
export function shortLabel(lessonType: string, sectionId: string): string {
  return `${lessonType} ${sectionId}`;
}
