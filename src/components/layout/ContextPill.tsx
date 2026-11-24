"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import SetupSheet from "@/components/layout/SetupSheet";
import { usePlan } from "@/hooks/use-plan";

/** Programme · intake · trimester, always visible so the student knows which plan this is. */
export default function ContextPill() {
  const plan = usePlan();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Plan: ${plan.programme}, ${plan.intake}, ${plan.term}. Change`}
        className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-card px-3 text-small-medium text-fg"
      >
        {plan.programme} · {plan.intake} · {plan.term}
        <Icon name="chevron-down" size={14} className="text-fg-secondary" />
      </button>
      <SetupSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
