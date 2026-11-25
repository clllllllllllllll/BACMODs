import { describe, expect, it } from "vitest";
import { weekMonday, weekRangeLabel } from "@/lib/calendar";

const cal = { week1Monday: "2027-01-11", teachingWeeks: 13, recessAfterWeeks: [6] };

describe("calendar", () => {
  it("week 1 starts on week1Monday", () => {
    expect(weekMonday(cal, 1)).toBe(Date.UTC(2027, 0, 11));
  });
  it("skips the recess week after week 6", () => {
    expect(weekMonday(cal, 7)).toBe(Date.UTC(2027, 0, 11) + 7 * 7 * 86_400_000);
  });
  it("labels a week within one month", () => {
    expect(weekRangeLabel(cal, 1)).toBe("11–15 Jan");
  });
  it("labels a week across two months", () => {
    expect(weekRangeLabel({ ...cal, week1Monday: "2027-01-28" }, 1)).toBe("28 Jan – 1 Feb");
  });
});
