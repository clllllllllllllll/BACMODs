import { describe, expect, it } from "vitest";
import { assignOverlapLanes, gapsBeforeSessions } from "@/lib/timetable";

const interval = (start: string, end: string) => ({ start, end });

describe("gapsBeforeSessions", () => {
  it("does not show a gap after a session nested inside a longer one", () => {
    const sessions = [
      interval("09:00", "13:00"), interval("10:00", "11:00"), interval("12:00", "13:00"),
    ];
    expect(gapsBeforeSessions(sessions)).toEqual([0, 0, 0]);
    expect(gapsBeforeSessions([...sessions, interval("14:00", "15:00")])).toEqual([0, 0, 0, 60]);
  });
});

describe("assignOverlapLanes", () => {
  it("gives each simultaneous session a lane and restores full width after the group", () => {
    expect(assignOverlapLanes([
      interval("13:00", "14:00"), interval("09:00", "13:00"), interval("10:00", "12:00"), interval("11:00", "12:00"),
    ])).toEqual([{ lane: 0, lanes: 1 }, { lane: 0, lanes: 3 }, { lane: 1, lanes: 3 }, { lane: 2, lanes: 3 }]);
  });

  it("reuses the lane of a finished session within a connected group", () => {
    expect(assignOverlapLanes([
      interval("09:00", "10:00"), interval("09:30", "11:00"), interval("10:00", "10:30"),
    ])).toEqual([{ lane: 0, lanes: 2 }, { lane: 1, lanes: 2 }, { lane: 0, lanes: 2 }]);
  });
});
