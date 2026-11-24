"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import SelectField from "@/components/ui/SelectField";
import TextInput from "@/components/ui/TextInput";
import { useToast } from "@/components/ui/Toast";
import { OFFLINE_MESSAGE, useIsOnline } from "@/hooks/use-online";
import { planActions, usePlanState } from "@/hooks/use-plan";
import { lookupMockShare } from "@/lib/mock/shares";
import type { Plan, SharePayload } from "@/lib/schemas/plan";

const INTAKES = [
  { value: "AY25", label: "AY25" },
  { value: "AY26", label: "AY26" },
];
// Only terms with a published dataset are listed (design.md §7).
const TERMS = [{ value: "Y1T2", label: "Y1T2 · Upcoming" }];

const INVALID_CODE = "That code doesn't match a saved plan. Check it and try again.";

type SetupFormProps = {
  submitLabel: string;
  large?: boolean;
  shareInput?: string | null;
  onDone: (fromLink?: boolean) => void;
};

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
  const key = props.shareInput == null ? JSON.stringify([plan.programme, plan.intake, plan.term]) : `share:${props.shareInput}`;
  return <SetupFields key={key} plan={plan} {...props} />;
}

function SetupFields({ plan, submitLabel, large, shareInput, onDone }: SetupFormProps & { plan: Plan }) {
  const toast = useToast();
  const online = useIsOnline();
  const codeId = useId();
  const [intake, setIntake] = useState(plan.intake);
  const [term, setTerm] = useState(plan.term);
  const [code, setCode] = useState(shareInput ?? "");
  const [linkedPlan] = useState(() => shareInput == null ? null : lookupMockShare(shareInput));
  const [codeError, setCodeError] = useState(shareInput != null && !linkedPlan ? INVALID_CODE : undefined);
  const importedLink = useRef(false);

  const loadShared = useCallback((payload: SharePayload, fromLink: boolean) => {
    planActions.loadShared(payload);
    toast("Plan loaded from share code");
    onDone(fromLink);
  }, [onDone, toast]);

  useEffect(() => {
    if (!online || !linkedPlan || importedLink.current) return;
    importedLink.current = true;
    loadShared(linkedPlan, true);
  }, [linkedPlan, loadShared, online]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    planActions.setSetup(intake, term);
    onDone();
  }

  function importCode(e: React.FormEvent) {
    e.preventDefault();
    if (!online) return;
    const payload = lookupMockShare(code);
    if (!payload) {
      setCodeError(INVALID_CODE);
      return;
    }
    loadShared(payload, false);
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
          id={codeId}
          label="Share code"
          placeholder="BACMODS-XXXXX"
          autoComplete="off"
          disabled={!online}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setCodeError(undefined);
          }}
          error={online ? codeError : undefined}
          helper={online ? "Paste a code or link from a friend to load their plan." : OFFLINE_MESSAGE}
        />
        <Button
          type="submit"
          variant="secondary"
          fullWidth
          disabled={!online || code.trim() === ""}
          aria-describedby={online ? undefined : `${codeId}-note`}
        >
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
