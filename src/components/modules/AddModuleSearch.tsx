"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import TextInput from "@/components/ui/TextInput";
import { planActions } from "@/hooks/use-plan";
import { clashesWithPlan, curriculumCodes } from "@/lib/plan";
import type { TermDataset } from "@/lib/schemas/dataset";
import type { Plan } from "@/lib/schemas/plan";

/** Search for modules that are not on the student curriculum list and add them to the plan. */
export default function AddModuleSearch({ plan, dataset }: { plan: Plan; dataset: TermDataset }) {
  const [query, setQuery] = useState("");
  const onList = new Set(Object.values(curriculumCodes(plan, dataset)).flat());
  const q = query.trim().toUpperCase();
  const results = Object.values(dataset.modules).filter(
    (m) => !onList.has(m.code) && (q === "" || m.code.includes(q.replace(/\s+/g, "")) || m.title.toUpperCase().includes(q)),
  );

  return (
    <section aria-labelledby="add-module" className="flex flex-col gap-3">
      <h2 id="add-module" className="text-label uppercase text-fg-secondary">
        Add a module
      </h2>
      <TextInput
        label="Search by code or name"
        type="search"
        placeholder="e.g. INF2006"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-card">
        {results.length === 0 ? (
          <li className="px-4 py-3 text-small text-fg-secondary">No modules match “{query}”.</li>
        ) : (
          results.map((m) => {
            const inPlan = plan.added.includes(m.code);
            const clash = !inPlan && clashesWithPlan(m.sections.flatMap((s) => s.sessions), plan, dataset, { moduleCode: m.code });
            return (
              <li key={m.code} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-body-medium text-fg">
                    {m.code}
                    <StatusBadge status={inPlan ? "in-plan" : clash ? "clash" : "addable"} />
                  </p>
                  <p className="truncate text-small text-fg-secondary">
                    {m.title} · {m.credits} credits
                  </p>
                </div>
                {inPlan ? null : (
                  <Button variant="secondary" aria-label={`Add ${m.code}`} onClick={() => planActions.addModule(m.code)}>
                    Add
                  </Button>
                )}
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
