"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SetupForm, SetupPlaceholder } from "@/components/layout/SetupSheet";
import { MOCK_DATASET } from "@/lib/mock/dataset";

function StartPlanning() {
  const router = useRouter();
  const shareInput = useSearchParams().get("share");
  return (
    <SetupForm
      submitLabel="Start planning"
      large
      shareInput={shareInput}
      onDone={(fromLink) => fromLink ? router.replace("/modules") : router.push("/modules")}
    />
  );
}

/** First-visit screen: pick programme, intake and trimester, then start on Modules. */
export default function SetupScreen() {
  return (
    <div className="flex flex-col gap-4 lg:mt-8 lg:gap-5 lg:rounded-sheet lg:border lg:border-line lg:bg-card lg:p-8">
      <div className="flex flex-col gap-2 pt-4 lg:pt-0">
        <h1 className="text-heading">Plan your BAC timetable</h1>
        <p className="text-body text-fg-secondary">
          Choose your intake and trimester, pick a section for each class and spot clashes before you register.
        </p>
      </div>
      <Suspense fallback={<SetupPlaceholder />}>
        <StartPlanning />
      </Suspense>
      <p className="text-small text-fg-secondary">
        Unofficial planning tool. Check the registration system before you register. Sample data · version {MOCK_DATASET.version}
      </p>
    </div>
  );
}
