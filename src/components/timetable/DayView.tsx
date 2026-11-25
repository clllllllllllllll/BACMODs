"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { MODULE_STYLES } from "@/components/ui/module-color";
import { lessonTypeName } from "@/lib/class-types";
import { formatDayMonth, weekdayDate } from "@/lib/calendar";
import { venueLabel } from "@/lib/format";
import type { PlannedSession } from "@/lib/plan";
import { clashingIndexes } from "@/lib/clash";
import type { Session, TermCalendar } from "@/lib/schemas/dataset";
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
        <p className="mt-0.5 flex items-center gap-1 text-small text-fg">
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
  const panelId = useId();
  const days: Session["day"][] = showSaturday ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  const [selectedDay, setDay] = useState<Session["day"]>(1);
  const day = !showSaturday && selectedDay === 6 ? 1 : selectedDay;
  if (day !== selectedDay) setDay(day);

  // Move focus only if the disappearing Saturday tab had it.
  const restoreFocus = useRef(false);
  const saturdayTab = useCallback((tab: HTMLButtonElement | null) => {
    if (tab) return () => { restoreFocus.current = document.activeElement === tab; };
  }, []);
  useLayoutEffect(() => {
    if (!showSaturday && restoreFocus.current) {
      restoreFocus.current = false;
      document.getElementById(`${panelId}-tab-1`)?.focus();
    }
  }, [panelId, showSaturday]);

  const dayItems = items
    .filter((i) => i.session.day === day)
    .sort((a, b) => toMinutes(a.session.start) - toMinutes(b.session.start));
  const clashing = clashingIndexes(dayItems);
  const gaps = gapsBeforeSessions(dayItems.map((item) => item.session));

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowLeft": next = (index + days.length - 1) % days.length; break;
      case "ArrowRight": next = (index + 1) % days.length; break;
      case "Home": next = 0; break;
      case "End": next = days.length - 1; break;
      default: return;
    }
    event.preventDefault();
    setDay(days[next]);
    document.getElementById(`${panelId}-tab-${days[next]}`)?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Day" className="grid gap-1" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
        {days.map((d, index) => {
          const selected = d === day;
          const date = weekdayDate(calendar, week, d);
          return (
            <button
              key={d}
              type="button"
              role="tab"
              id={`${panelId}-tab-${d}`}
              ref={d === 6 ? saturdayTab : undefined}
              aria-selected={selected}
              aria-controls={panelId}
              aria-label={`${DAY_SHORT[d]} ${formatDayMonth(date)}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setDay(d)}
              onKeyDown={(event) => moveFocus(event, index)}
              className={`focus-ring flex h-11 flex-col items-center justify-center rounded-day-tab border ${
                selected ? "border-primary bg-primary text-on-primary" : "border-line bg-card text-fg"
              }`}
            >
              <span className="text-small-medium">{DAY_SHORT[d]}</span>{" "}
              <span className="text-caption">{new Date(date).getUTCDate()}</span>
            </button>
          );
        })}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-tab-${day}`} tabIndex={0} className="focus-ring rounded-control">
        <ul className="flex flex-col gap-2">
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
    </div>
  );
}
