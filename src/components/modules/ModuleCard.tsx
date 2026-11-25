"use client";

import ClassRow from "@/components/modules/ClassRow";
import Button from "@/components/ui/Button";
import { MODULE_STYLES } from "@/components/ui/module-color";
import { planActions } from "@/hooks/use-plan";
import { lessonTypesOf } from "@/lib/plan";
import type { Module, TermDataset } from "@/lib/schemas/dataset";
import type { Plan } from "@/lib/schemas/plan";

/** Module code and credits lead; the full name sits below in quieter text. */
export default function ModuleCard({
  module,
  plan,
  dataset,
  removable,
}: {
  module: Module;
  plan: Plan;
  dataset: TermDataset;
  removable?: boolean;
}) {
  const style = MODULE_STYLES[plan.colors[module.code] ?? "slate"];
  const lessonTypes = new Set([...lessonTypesOf(module), ...Object.keys(plan.selection[module.code] ?? {})]);
  return (
    <section
      aria-labelledby={`mod-${module.code}`}
      className={`overflow-hidden rounded-control border border-line border-l-4 bg-card ${style.border}`}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
        <div className="min-w-0">
          <h3 id={`mod-${module.code}`} className={`text-title ${style.text}`}>
            {module.code}
          </h3>
          <p className="text-small text-fg-secondary">{module.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-small-medium text-fg-secondary">{module.credits} credits</span>
          {removable ? (
            <Button
              variant="secondary"
              className="!h-7 !px-2 text-small-medium"
              aria-label={`Remove ${module.code}`}
              onClick={() => planActions.removeModule(module.code)}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </header>
      <ul className="divide-y divide-line border-t border-line">
        {[...lessonTypes].map((type) => (
          <ClassRow key={type} module={module} lessonType={type} plan={plan} dataset={dataset} />
        ))}
      </ul>
    </section>
  );
}
