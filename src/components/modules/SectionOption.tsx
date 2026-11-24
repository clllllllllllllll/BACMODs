"use client";

import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { sectionLines } from "@/lib/format";
import type { Section } from "@/lib/schemas/dataset";

/** One selectable section: a native radio, so arrow keys and screen readers work. */
export default function SectionOption({
  name,
  section,
  selected,
  clash,
  teachingWeeks,
  onSelect,
}: {
  name: string;
  section: Section;
  selected: boolean;
  clash: boolean;
  teachingWeeks: number;
  onSelect: () => void;
}) {
  return (
    <label
      className={`relative flex cursor-pointer items-start gap-3 rounded-clash border px-3 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
        clash ? "border-danger bg-danger-50" : selected ? "border-primary bg-primary-50" : "border-line bg-card"
      }`}
    >
      <input type="radio" name={name} checked={selected} onChange={onSelect} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-primary bg-primary text-on-primary" : "border-line bg-card"
        }`}
      >
        {selected ? <Icon name="check" size={10} /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-2">
          <span className="text-body-medium text-fg">{section.id}</span>
          <StatusBadge status={clash ? "clash" : "fits"} />
        </span>
        {sectionLines(section, teachingWeeks).map((line) => (
          <span key={line} className="text-small text-fg-secondary">
            {line}
          </span>
        ))}
      </span>
    </label>
  );
}
