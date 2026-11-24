"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { MODULE_STYLES } from "@/components/ui/module-color";
import { lessonTypeName } from "@/lib/class-types";
import { formatDayMonth, weekdayDate } from "@/lib/calendar";
import { venueLabel } from "@/lib/format";
import type { PlannedSession } from "@/lib/plan";
import { clashingIndexes } from "@/lib/clash";
import type { TermCalendar } from "@/lib/schemas/dataset";
import { DAY_LONG, DAY_SHORT, formatDuration, toMinutes } from "@/lib/time";
import { gapsBeforeSessions } from "@/lib/timetable";

function DayEvent({ item, clash }: { item: PlannedSession; clash: boolean }) {
  const style = MODULE_STYLES[item.color];
  return (
    <li className="flex gap-3">
      <div className="w-11 shrink-0 pt-2 text-small-medium text-fg">
        {item.session.start}
        <span className="block text-small text-fg-secondary">{item.session.end}</span>
      </div>
      <div
        className={`flex-1 rounded-clash border-l-4 px-3 py-2 ${style.tint} ${style.border} ${
          clash ? "outline-2 outline-danger" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`text-title ${style.text}`}>{item.moduleCode}</span>
          {clash ? <StatusBadge status="clash" /> : null}
        </div>
        <p className="text-body-medium text-fg">
          {lessonTypeName(item.lessonType)} · {item.sectionId}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-small text-fg-secondary">
          <Icon name="map-pin" size={12} />
          {venueLabel(item.session)}
        </p>
      </div>
    </li>
  );
}

function FreeGap({ minutes }: { minutes: number }) {
  return <li className="pl-14 text-small text-fg-secondary">Free · {formatDuration(minutes)}</li>;
}

/** One day at a time: Day tabs, then events with the free time between them. */
export default function DayView({
  items,
  week,
  calendar,
  showSaturday,
}: {
  items: PlannedSession[];
  week: number;
  calendar: TermCalendar;
  showSaturday: boolean;
}) {
  const days = showSaturday ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  const [day, setDay] = useState(1);
  const dayItems = items
    .filter((i) => i.session.day === day)
    .sort((a, b) => toMinutes(a.session.start) - toMinutes(b.session.start));
  const clashing = clashingIndexes(dayItems);
  const gaps = gapsBeforeSessions(dayItems.map((item) => item.session));

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Day" className="grid gap-1" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
        {days.map((d) => {
          const selected = d === day;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              id={`day-tab-${d}`}
              aria-selected={selected}
              aria-controls="day-panel"
              aria-label={`${DAY_LONG[d]} ${formatDayMonth(weekdayDate(calendar, week, d))}`}
              onClick={() => setDay(d)}
              className={`focus-ring flex h-11 flex-col items-center justify-center rounded-day-tab border ${
                selected ? "border-primary bg-primary text-on-primary" : "border-line bg-card text-fg"
              }`}
            >
              <span className="text-small-medium">{DAY_SHORT[d]}</span>
              <span className="text-caption">{new Date(weekdayDate(calendar, week, d)).getUTCDate()}</span>
            </button>
          );
        })}
      </div>
      <ul id="day-panel" role="tabpanel" aria-labelledby={`day-tab-${day}`} className="flex flex-col gap-2">
        {dayItems.length === 0 ? (
          <li className="rounded-control border border-dashed border-line bg-card px-4 py-4 text-body text-fg-secondary">
            No classes on {DAY_LONG[day]} this week.
          </li>
        ) : (
          dayItems.flatMap((item, i) => {
            const gap = gaps[i];
            const key = `${item.moduleCode}-${item.lessonType}-${item.session.start}`;
            return [
              gap >= 30 ? <FreeGap key={`gap-${key}`} minutes={gap} /> : null,
              <DayEvent key={key} item={item} clash={clashing.has(i)} />,
            ];
          })
        )}
      </ul>
    </div>
  );
}
