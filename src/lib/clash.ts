import type { Session } from "@/lib/schemas/dataset";
import { toMinutes } from "@/lib/time";

/**
 * Two sessions clash when they share a day, their times overlap and they share a teaching week.
 * Back-to-back sessions (one ends when the other starts) do not clash.
 */
export function sessionsClash(a: Session, b: Session): boolean {
  if (a.day !== b.day) return false;
  if (toMinutes(a.start) >= toMinutes(b.end) || toMinutes(b.start) >= toMinutes(a.end)) return false;
  return a.weeks.some((w) => b.weeks.includes(w));
}

/** Indexes of every item that clashes with at least one other item. */
export function clashingIndexes<T extends { session: Session }>(items: T[]): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (sessionsClash(items[i].session, items[j].session)) {
        out.add(i);
        out.add(j);
      }
    }
  }
  return out;
}
