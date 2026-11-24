"use client";

import Icon from "@/components/ui/Icon";
import { recessFollows, weekRangeLabel } from "@/lib/calendar";
import type { TermCalendar } from "@/lib/schemas/dataset";

export default function WeekSwitcher({
  calendar,
  week,
  onChange,
}: {
  calendar: TermCalendar;
  week: number;
  onChange: (week: number) => void;
}) {
  const btn =
    "focus-ring flex size-9 items-center justify-center rounded-control border border-line bg-card text-fg disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        className={btn}
        aria-label="Previous week"
        disabled={week <= 1}
        onClick={() => onChange(week - 1)}
      >
        <Icon name="chevron-left" />
      </button>
      <p aria-live="polite" className="text-center">
        <span className="block text-title">Week {week}</span>
        <span className="block text-small text-fg-secondary">
          {weekRangeLabel(calendar, week)}
          {recessFollows(calendar, week) ? " · recess week follows" : ""}
        </span>
      </p>
      <button
        type="button"
        className={btn}
        aria-label="Next week"
        disabled={week >= calendar.teachingWeeks}
        onClick={() => onChange(week + 1)}
      >
        <Icon name="chevron-right" />
      </button>
    </div>
  );
}
