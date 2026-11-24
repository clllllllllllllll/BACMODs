import { describe, expect, it } from "vitest";
import { formatWeekNumbers, sessionTime, venueLabel } from "@/lib/format";

const base = { day: 5 as const, start: "09:00", end: "12:00", venue: null };

describe("format", () => {
  it("compresses week ranges", () => {
    expect(formatWeekNumbers([1, 2, 3, 5, 6, 9])).toBe("1–3, 5–6, 9");
    expect(formatWeekNumbers([6])).toBe("6");
  });
  it("omits weeks for a session that runs all term", () => {
    expect(sessionTime({ ...base, weeks: [1, 2, 3] }, 3)).toBe("Fri 09:00–12:00");
  });
  it("adds weeks for a partial session", () => {
    expect(sessionTime({ ...base, weeks: [12, 13] }, 13)).toBe("Fri 09:00–12:00 · wk 12–13");
  });
  it("falls back to Venue TBA", () => {
    expect(venueLabel({ ...base, weeks: [1] })).toBe("Venue TBA");
  });
});
