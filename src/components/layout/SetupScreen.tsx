"use client";

import { useRouter } from "next/navigation";
import { SetupForm } from "@/components/layout/SetupSheet";

/** First-visit screen: pick programme, intake and trimester, then start on Modules. */
export default function SetupScreen() {
  const router = useRouter();
  return (
    <>
      <div className="flex flex-col gap-2 pt-4">
        <h1 className="text-heading">Plan your BAC timetable</h1>
        <p className="text-body text-fg-secondary">
          Choose your intake and trimester, pick a section for each class and spot clashes before you register.
        </p>
      </div>
      <SetupForm submitLabel="Start planning" large onDone={() => router.push("/modules")} />
      <p className="text-small text-fg-secondary">
        Unofficial planning tool. Always check the registration system. Showing sample data only.
      </p>
    </>
  );
}
