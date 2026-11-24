import type { TermCalendar } from "@/lib/schemas/dataset";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Monday of a teaching week, as a UTC timestamp. Recess weeks push later weeks back. */
export function weekMonday(calendar: TermCalendar, week: number): number {
  const recessBefore = calendar.recessAfterWeeks.filter((w) => w < week).length;
  return Date.parse(`${calendar.week1Monday}T00:00:00Z`) + (week - 1 + recessBefore) * 7 * DAY_MS;
}

/** Date of a weekday (1 = Mon) in a teaching week, as a UTC timestamp. */
export function weekdayDate(calendar: TermCalendar, week: number, day: number): number {
  return weekMonday(calendar, week) + (day - 1) * DAY_MS;
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-SG", { timeZone: "UTC", ...opts });
const dayMonth = fmt({ day: "numeric", month: "short" });
const dayOnly = fmt({ day: "numeric" });

/** "11 Jan" */
export function formatDayMonth(timestamp: number): string {
  return dayMonth.format(timestamp);
}

/** "11–15 Jan", or "28 Jan – 1 Feb" across months. Monday to Friday. */
export function weekRangeLabel(calendar: TermCalendar, week: number): string {
  const mon = weekMonday(calendar, week);
  const fri = mon + 4 * DAY_MS;
  const sameMonth = dayMonth.format(mon).split(" ")[1] === dayMonth.format(fri).split(" ")[1];
  return sameMonth
    ? `${dayOnly.format(mon)}–${dayMonth.format(fri)}`
    : `${dayMonth.format(mon)} – ${dayMonth.format(fri)}`;
}

/** True when a recess week follows this teaching week. */
export function recessFollows(calendar: TermCalendar, week: number): boolean {
  return calendar.recessAfterWeeks.includes(week);
}
