"use client";

import { useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import SelectField from "@/components/ui/SelectField";
import TextInput from "@/components/ui/TextInput";
import { useToast } from "@/components/ui/Toast";
import { planActions, usePlanState } from "@/hooks/use-plan";
import { lookupMockShare } from "@/lib/mock/shares";
import type { Plan } from "@/lib/schemas/plan";
import { parseShareInput } from "@/lib/share";

const INTAKES = [
  { value: "AY25", label: "AY25" },
  { value: "AY26", label: "AY26" },
];
// Only terms with a published dataset are listed (design.md §7).
const TERMS = [{ value: "Y1T2", label: "Y1T2 · Upcoming" }];

const INVALID_CODE = "That code doesn't match a saved plan. Check it and try again.";

type SetupFormProps = { submitLabel: string; large?: boolean; onDone: () => void };

export function SetupPlaceholder() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="h-10 rounded-control bg-page" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-10 rounded-control bg-page" />
        <div className="h-10 rounded-control bg-page" />
      </div>
      <div className="h-12 rounded-control bg-page" />
    </div>
  );
}

/** Mount form state only after the saved plan is known. */
export function SetupForm(props: SetupFormProps) {
  const { plan, loaded } = usePlanState();
  if (!loaded) return <SetupPlaceholder />;
  return <SetupFields key={JSON.stringify([plan.programme, plan.intake, plan.term])} plan={plan} {...props} />;
}

function SetupFields({ plan, submitLabel, large, onDone }: SetupFormProps & { plan: Plan }) {
  const toast = useToast();
  const [intake, setIntake] = useState(plan.intake);
  const [term, setTerm] = useState(plan.term);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    planActions.setSetup(intake, term);
    onDone();
  }

  function importCode(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseShareInput(code);
    const payload = parsed ? lookupMockShare(parsed) : null;
    if (!payload) {
      setCodeError(INVALID_CODE);
      return;
    }
    planActions.loadShared(payload);
    toast("Plan loaded from share code");
    onDone();
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <SelectField
          label="Programme"
          disabled
          options={[{ value: "BAC", label: "BAC · Applied Computing" }]}
          value="BAC"
          onChange={() => {}}
          helper="More programmes coming soon"
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Intake" options={INTAKES} value={intake} onChange={(e) => setIntake(e.target.value)} />
          <SelectField label="Trimester" options={TERMS} value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
        <p className="text-small text-fg-secondary">Switching keeps your current plan saved on this device.</p>
        <Button type="submit" size={large ? "large" : "default"} fullWidth>
          {submitLabel}
        </Button>
      </form>
      <form onSubmit={importCode} className="flex flex-col gap-3 border-t border-line pt-5">
        <TextInput
          label="Share code"
          placeholder="BACMODS-XXXXX"
          autoComplete="off"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setCodeError(undefined);
          }}
          error={codeError}
          helper="Paste a code or link from a friend to load their plan."
        />
        <Button type="submit" variant="secondary" fullWidth disabled={code.trim() === ""}>
          Load plan
        </Button>
      </form>
    </div>
  );
}

export default function SetupSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Your plan">
      {/* Mounted only while open so the fields start from the saved plan each time. */}
      {open ? (
        <SetupForm
          submitLabel="Update plan"
          onDone={onClose}
        />
      ) : null}
    </BottomSheet>
  );
}
