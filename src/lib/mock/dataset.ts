// Synthetic data for the S1 shell. Nothing here comes from the real APA timetable.
import { TermDatasetSchema, type Section, type Session, type TermDataset } from "@/lib/schemas/dataset";

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const ALL_WEEKS = range(1, 13);

function session(
  day: Session["day"],
  start: string,
  end: string,
  venue: string | null,
  weeks: number[] = ALL_WEEKS,
): Session {
  return { day, start, end, venue, weeks };
}

function section(lessonType: string, id: string, ...sessions: Session[]): Section {
  return { id, lessonType, sessions };
}

const raw: TermDataset = {
  ay: 2026,
  trimester: "T2",
  version: "mock-1",
  publishedOn: "2026-11-24",
  calendar: { week1Monday: "2027-01-11", teachingWeeks: 13, recessAfterWeeks: [6] },
  curriculum: [
    { code: "INF1105", programme: "BAC", intakeAy: 2026, year: 1, trimester: "T2", kind: "mandatory" },
    { code: "INF1107", programme: "BAC", intakeAy: 2026, year: 1, trimester: "T2", kind: "mandatory" },
    { code: "INF2008", programme: "BAC", intakeAy: 2026, year: 1, trimester: "T2", kind: "mandatory" },
    { code: "AAI1001", programme: "BAC", intakeAy: 2026, year: 1, trimester: "T2", kind: "mandatory" },
  ],
  modules: {
    INF1105: {
      code: "INF1105",
      title: "Sample: Programming Fundamentals",
      credits: 4,
      sections: [
        section("LTR", "ALL", session(1, "09:00", "11:00", "Sample Hall 1")),
        section("TUT", "T1", session(3, "10:00", "12:00", "Sample Room 2-01", range(2, 13))),
        section("TUT", "T2", session(3, "14:00", "16:00", "Sample Room 2-01", range(2, 13))),
        section("TUT", "T3", session(2, "10:00", "11:30", "Sample Room 2-03", range(2, 13))),
      ],
    },
    INF1107: {
      code: "INF1107",
      title: "Sample: Data Structures",
      credits: 4,
      sections: [
        section("LEC", "ALL", session(2, "09:00", "11:00", "Sample Hall 2")),
        section("LAB", "P1", session(4, "13:00", "16:00", "Sample Lab A", range(1, 13))),
        section(
          "LAB",
          "P2",
          session(5, "09:00", "12:00", "Sample Lab A", range(1, 11)),
          session(1, "18:00", "20:00", "Sample Lab B", range(12, 13)),
        ),
        section("LAB", "P3", session(5, "13:00", "16:00", "Sample Lab B")),
        section("QUIZ", "Q1", session(3, "18:00", "19:00", "Sample Hall 2", [6])),
        section("QUIZ", "Q2", session(4, "18:00", "19:00", "Sample Hall 2", [6])),
      ],
    },
    INF2008: {
      code: "INF2008",
      title: "Sample: Web Systems",
      credits: 4,
      sections: [
        section("LEC", "ALL", session(3, "14:00", "16:00", "Sample Hall 1")),
        section("LAB", "ALL", session(4, "09:00", "12:00", "Sample Lab C")),
      ],
    },
    AAI1001: {
      code: "AAI1001",
      title: "Sample: Intelligent Systems",
      credits: 3,
      sections: [
        section("LEC", "ALL", session(2, "13:00", "15:00", "Sample Hall 3")),
        section("TUT", "ALL", session(5, "14:00", "16:00", null)),
      ],
    },
    INF2006: {
      code: "INF2006",
      title: "Sample: Database Systems",
      credits: 4,
      sections: [
        section("LEC", "ALL", session(1, "14:00", "16:00", "Sample Hall 1")),
        section("LAB", "L1", session(2, "16:00", "19:00", "Sample Lab A")),
        section("LAB", "L2", session(4, "16:00", "19:00", "Sample Lab A")),
      ],
    },
    BAC4000A: {
      code: "BAC4000A",
      title: "Sample: Capstone Seminar",
      credits: 2,
      sections: [section("WKS", "W1", session(2, "09:30", "11:30", "Sample Room 4-02"))],
    },
  },
};

/** Parsed once so the mock goes through the same contract as real data will. */
export const MOCK_DATASET: TermDataset = TermDatasetSchema.parse(raw);

/** The term the shell has data for. */
export const MOCK_TERM = { intake: "AY26", term: "Y1T2" } as const;

/** Share code that loads a ready-made mock plan (src/lib/mock/shares.ts). */
export const MOCK_SHARE_CODE = "BACMODS-7KQ2X";
