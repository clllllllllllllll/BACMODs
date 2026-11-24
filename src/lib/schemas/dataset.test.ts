import { describe, expect, it } from "vitest";
import { CalendarSchema, SessionSchema } from "@/lib/schemas/dataset";

describe("SessionSchema", () => {
  const session = { day: 1, start: "09:00", end: "10:00", venue: null, weeks: [1] };

  it("accepts a session that ends after it starts", () => {
    expect(SessionSchema.safeParse(session).success).toBe(true);
  });

  it.each(["08:59", "09:00"])("rejects end time %s", (end) => {
    const parsed = SessionSchema.safeParse({ ...session, end });
    expect(parsed.error?.issues[0].path).toEqual(["end"]);
  });
});

describe("CalendarSchema", () => {
  const calendar = { teachingWeeks: 13, recessAfterWeeks: [6] };

  it.each(["2027-01-11", "2044-02-29"])("accepts the real ISO Monday %s", (week1Monday) => {
    expect(CalendarSchema.safeParse({ ...calendar, week1Monday }).success).toBe(true);
  });

  it.each(["2027-01-12", "2027-02-29", "2027-13-11", "2027-1-11"])("rejects %s", (week1Monday) => {
    const parsed = CalendarSchema.safeParse({ ...calendar, week1Monday });
    expect(parsed.error?.issues[0].path).toEqual(["week1Monday"]);
  });
});
