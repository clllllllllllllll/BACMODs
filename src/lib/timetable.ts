import type { Session } from "@/lib/schemas/dataset";
import { toMinutes } from "@/lib/time";

type Interval = Pick<Session, "start" | "end">;
type Placement = { lane: number; lanes: number };

/** Free minutes before each session in one day, ordered by start time. */
export function gapsBeforeSessions(sessions: Interval[]): number[] {
  let latestEnd = 0;
  return sessions.map(({ start, end }, index) => {
    const gap = index === 0 ? 0 : Math.max(0, toMinutes(start) - latestEnd);
    latestEnd = Math.max(latestEnd, toMinutes(end));
    return gap;
  });
}

/** Assign lanes within each connected overlap group of one day's sessions. */
export function assignOverlapLanes(sessions: Interval[]): Placement[] {
  const ordered = sessions.map(({ start, end }, index) => ({
    index,
    start: toMinutes(start),
    end: toMinutes(end),
  })).sort((a, b) => a.start - b.start || b.end - a.end);
  const placements: Placement[] = [];
  let group: { index: number; lane: number }[] = [];
  let laneEnds: number[] = [];
  let latestEnd = 0;

  function finishGroup() {
    for (const { index, lane } of group) placements[index] = { lane, lanes: laneEnds.length };
    group = [];
    laneEnds = [];
    latestEnd = 0;
  }

  for (const { index, start, end } of ordered) {
    if (start >= latestEnd) finishGroup();
    const available = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    const lane = available === -1 ? laneEnds.length : available;
    laneEnds[lane] = end;
    latestEnd = Math.max(latestEnd, end);
    group.push({ index, lane });
  }

  finishGroup();
  return placements;
}
