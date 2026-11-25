"use client";

import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import { MODULE_STYLES } from "@/components/ui/module-color";
import { useCopy } from "@/hooks/use-copy";
import { sectionListRows } from "@/lib/plan";
import type { TermDataset } from "@/lib/schemas/dataset";
import type { Plan } from "@/lib/schemas/plan";

/** The chosen sections, one Section row per module, with a Copy list action. */
export default function SectionList({ plan, dataset }: { plan: Plan; dataset: TermDataset }) {
  const copy = useCopy();
  const rows = sectionListRows(plan, dataset);
  const copyList = () => {
    const text = rows.map(({ code, sections }) => sections.length ? `${code} ${sections.join(" · ")}` : code).join("\n");
    void copy(text, "Section list copied");
  };
  return (
    <section aria-labelledby="sections-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="sections-heading" className="text-title">
          Your sections
        </h2>
        <Button variant="secondary" disabled={rows.length === 0} onClick={copyList}>
          Copy list
        </Button>
      </div>
      {rows.length > 0 ? (
        <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-card">
          {rows.map(({ code, color, sections }) => (
            <li key={code} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
              <span className="flex items-center gap-2 text-body-medium">
                <span aria-hidden="true" className={`size-2.5 rounded-full ${MODULE_STYLES[color].dot}`} />
                {code}
              </span>
              <span className="flex flex-wrap gap-1.5">
                {sections.map((label) => <Chip key={label} color={color}>{label}</Chip>)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
