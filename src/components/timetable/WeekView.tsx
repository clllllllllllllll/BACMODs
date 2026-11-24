import Icon from "@/components/ui/Icon";
import { MODULE_STYLES } from "@/components/ui/module-color";
import { shortLabel } from "@/lib/class-types";
import { clashingIndexes } from "@/lib/clash";
import { venueLabel } from "@/lib/format";
import type { PlannedSession } from "@/lib/plan";
import { DAY_SHORT, toMinutes } from "@/lib/time";

const HOUR_HEIGHT = 40;

/** Greedy lane assignment: overlapping blocks are staggered so each stays readable. */
function assignLanes(items: PlannedSession[]): { lane: number; lanes: number }[] {
  const order = items.map((_, i) => i).sort((a, b) => toMinutes(items[a].session.start) - toMinutes(items[b].session.start));
  const lanesOf: number[] = [];
  const ends: number[] = [];
  for (const i of order) {
    const start = toMinutes(items[i].session.start);
    let lane = ends.findIndex((end) => end <= start);
    if (lane === -1) lane = ends.length;
    ends[lane] = toMinutes(items[i].session.end);
    lanesOf[i] = lane;
  }
  const total = Math.max(1, ends.length);
  return items.map((_, i) => ({ lane: lanesOf[i], lanes: total }));
}

/** Mon–Fri grid (plus Sat when the plan needs it) with a block per session. */
export default function WeekView({
  items,
  allItems,
  showSaturday,
}: {
  /** Sessions running in the chosen week. */
  items: PlannedSession[];
  /** Every session in the plan, so the hour range stays the same from week to week. */
  allItems: PlannedSession[];
  showSaturday: boolean;
}) {
  const days = showSaturday ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  const starts = allItems.map((i) => toMinutes(i.session.start));
  const ends = allItems.map((i) => toMinutes(i.session.end));
  const firstHour = Math.min(9, ...starts.map((m) => Math.floor(m / 60)));
  const lastHour = Math.max(17, ...ends.map((m) => Math.ceil(m / 60)));
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i);
  const clashing = clashingIndexes(items);

  return (
    <div className="flex flex-col">
      <div className="flex pl-9" aria-hidden="true">
        {days.map((d) => (
          <div key={d} className="flex-1 pb-1 text-center text-small-medium text-fg-secondary">
            {DAY_SHORT[d]}
          </div>
        ))}
      </div>
      <div
        role="group"
        aria-label="Week timetable"
        className="relative flex rounded-control border border-line bg-card"
        style={{ height: (lastHour - firstHour) * HOUR_HEIGHT }}
      >
        <div className="relative w-9 shrink-0" aria-hidden="true">
          {hours.slice(0, -1).map((h) => (
            <span
              key={h}
              className="absolute right-1 -translate-y-1/2 text-micro-regular text-fg-secondary"
              style={{ top: (h - firstHour) * HOUR_HEIGHT }}
            >
              {String(h).padStart(2, "0")}
            </span>
          ))}
        </div>
        {days.map((d) => {
          const dayIdx = items.map((_, i) => i).filter((i) => items[i].session.day === d);
          const dayItems = dayIdx.map((i) => items[i]);
          const lanes = assignLanes(dayItems);
          return (
            <div key={d} className="relative flex-1 border-l border-line">
              {hours.slice(1, -1).map((h) => (
                <div
                  key={h}
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-line"
                  style={{ top: (h - firstHour) * HOUR_HEIGHT }}
                />
              ))}
              {dayItems.map((item, k) => {
                const clash = clashing.has(dayIdx[k]);
                const style = MODULE_STYLES[item.color];
                const top = ((toMinutes(item.session.start) - firstHour * 60) / 60) * HOUR_HEIGHT;
                const height = ((toMinutes(item.session.end) - toMinutes(item.session.start)) / 60) * HOUR_HEIGHT;
                const { lane, lanes: n } = lanes[k];
                const label = shortLabel(item.lessonType, item.sectionId);
                return (
                  <div
                    key={`${item.moduleCode}-${label}-${item.session.start}`}
                    role="img"
                    aria-label={`${item.moduleCode} ${label}, ${DAY_SHORT[d]} ${item.session.start} to ${item.session.end}, ${venueLabel(item.session)}${clash ? ", clash" : ""}`}
                    className={`absolute overflow-hidden rounded-block px-1 py-0.5 ${style.tint} ${style.text} ${
                      clash ? "border-2 border-danger" : "border border-transparent"
                    }`}
                    style={{
                      top: top + 1,
                      height: height - 2,
                      left: `calc(${lane * 22}% + 1px)`,
                      width: `calc(${100 - (n - 1) * 22}% - 2px)`,
                    }}
                  >
                    <span className="flex items-center gap-0.5 text-micro">
                      {clash ? <Icon name="alert-circle" size={10} /> : null}
                      {item.moduleCode}
                    </span>
                    <span className="block text-micro-regular">{label}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
