"use client";

import ClashStatus from "@/components/timetable/ClashStatus";
import DayView from "@/components/timetable/DayView";
import WeekSwitcher from "@/components/timetable/WeekSwitcher";
import WeekView from "@/components/timetable/WeekView";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { useIsDesktop } from "@/hooks/use-desktop";
import { planActions, usePlan } from "@/hooks/use-plan";
import { MOCK_DATASET } from "@/lib/mock/dataset";
import { hasSaturday, planClashes } from "@/lib/plan";

export default function TimetableScreen() {
  const plan = usePlan();
  const desktop = useIsDesktop();
  const dataset = MOCK_DATASET;
  const { count, items } = planClashes(plan, dataset);
  const week = Math.min(plan.week, dataset.calendar.teachingWeeks);
  const inWeek = items.filter((i) => i.session.weeks.includes(week));
  const saturday = hasSaturday(items);
  // Week is the default on desktop until the student chooses (design.md §4).
  const view = plan.view === "auto" ? (desktop ? "week" : "day") : plan.view;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-heading">Timetable</h1>
        <SegmentedControl
          label="View"
          value={view}
          onChange={planActions.setView}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
          ]}
        />
      </div>
      <ClashStatus count={count} />
      <WeekSwitcher calendar={dataset.calendar} week={week} onChange={planActions.setWeek} />
      {view === "day" ? (
        <DayView key={week} items={inWeek} week={week} calendar={dataset.calendar} showSaturday={saturday} />
      ) : (
        <WeekView items={inWeek} allItems={items} showSaturday={saturday} />
      )}
    </>
  );
}
