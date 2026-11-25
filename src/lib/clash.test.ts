import { describe, expect, it } from "vitest";
import { sessionsClash } from "@/lib/clash";
import type { Session } from "@/lib/schemas/dataset";

const s = (day: Session["day"], start: string, end: string, weeks: number[]): Session => ({
  day,
  start,
  end,
  venue: null,
  weeks,
});

describe("sessionsClash", () => {
  it("flags same day, overlapping time and overlapping weeks", () => {
    expect(sessionsClash(s(2, "09:00", "11:00", [1, 2, 3]), s(2, "10:00", "12:00", [3, 4]))).toBe(true);
  });
  it("does not flag a week-6 quiz against a weeks 1–5 lab", () => {
    expect(sessionsClash(s(3, "18:00", "19:00", [6]), s(3, "18:00", "20:00", [1, 2, 3, 4, 5]))).toBe(false);
  });
  it("does not flag back-to-back sessions", () => {
    expect(sessionsClash(s(1, "09:00", "11:00", [1]), s(1, "11:00", "12:00", [1]))).toBe(false);
  });
  it("does not flag different days", () => {
    expect(sessionsClash(s(1, "09:00", "11:00", [1]), s(2, "09:00", "11:00", [1]))).toBe(false);
  });
  it("flags an overlapping Saturday session only against another Saturday session", () => {
    const saturday = s(6, "09:00", "11:00", [1]);
    expect(sessionsClash(saturday, s(6, "10:00", "12:00", [1]))).toBe(true);
    expect(sessionsClash(saturday, s(5, "10:00", "12:00", [1]))).toBe(false);
  });
});
