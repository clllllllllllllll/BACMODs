"use client";

import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import { MODULE_STYLES } from "@/components/ui/module-color";
import { useCopy } from "@/hooks/use-copy";
import { chosenSection, lessonTypesOf, planCodes, sectionListLines } from "@/lib/plan";
import type { TermDataset } from "@/lib/schemas/dataset";
import type { Plan } from "@/lib/schemas/plan";

/** The chosen sections, one Section row per module, with a Copy list action. */
export default function SectionList({ plan, dataset }: { plan: Plan; dataset: TermDataset }) {
  const copy = useCopy();
  const lines = sectionListLines(plan, dataset);
  return (
    <section aria-labelledby="sections-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="sections-heading" className="text-title">
          Your sections
        </h2>
        <Button
          variant="secondary"
          onClick={() => copy(lines.map((l) => l.line).join("\n"), "Section list copied")}
        >
          Copy list
        </Button>
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-card">
        {planCodes(plan, dataset).map((code) => {
          const mod = dataset.modules[code];
          const color = plan.colors[code] ?? "slate";
          return (
            <li key={code} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
              <span className="flex items-center gap-2 text-body-medium">
                <span aria-hidden="true" className={`size-2.5 rounded-full ${MODULE_STYLES[color].dot}`} />
                {code}
              </span>
              <span className="flex flex-wrap gap-1.5">
                {lessonTypesOf(mod).map((t) => {
                  const s = chosenSection(plan, mod, t);
                  return s ? (
                    <Chip key={t} color={color}>
                      {t} {s.id}
                    </Chip>
                  ) : null;
                })}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
