"use client";

import WeekSwitcher from "@/components/timetable/WeekSwitcher";
import WeekView from "@/components/timetable/WeekView";
import ClashStatus from "@/components/timetable/ClashStatus";
import { planActions } from "@/hooks/use-plan";
import { hasSaturday, type PlannedSession } from "@/lib/plan";
import type { TermCalendar } from "@/lib/schemas/dataset";

/** Desktop only: the same week grid as the Timetable screen, beside the module cards. */
export default function WeekPreview({ items, count, selectedWeek, calendar }: {
  items: PlannedSession[];
  count: number;
  selectedWeek: number;
  calendar: TermCalendar;
}) {
  const week = Math.min(selectedWeek, calendar.teachingWeeks);
  const inWeek = items.filter((i) => i.session.weeks.includes(week));
  return (
    <aside
      aria-labelledby="preview-heading"
      className="hidden flex-col gap-4 lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="preview-heading" className="text-title">
          Week preview
        </h2>
        <ClashStatus count={count} />
      </div>
      <WeekSwitcher calendar={calendar} week={week} onChange={planActions.setWeek} />
      <WeekView items={inWeek} allItems={items} showSaturday={hasSaturday(items)} />
    </aside>
  );
}
