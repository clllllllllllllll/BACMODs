"use client";

import { useState } from "react";
import ExportTile from "@/components/export/ExportTile";
import SectionList from "@/components/export/SectionList";
import ShareSheet from "@/components/export/ShareSheet";
import { useToast } from "@/components/ui/Toast";
import { usePlan } from "@/hooks/use-plan";
import { MOCK_DATASET } from "@/lib/mock/dataset";

export default function ExportScreen() {
  const plan = usePlan();
  const toast = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <>
      <h1 className="text-heading">Export</h1>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <SectionList plan={plan} dataset={MOCK_DATASET} />
      <div className="flex flex-col gap-3">
        <ExportTile
          icon="calendar"
          title="Add to calendar"
          description="Download a .ics file for your calendar app"
          trailing="external-link"
          onClick={() => toast("Calendar export is coming soon.")}
        />
        <ExportTile
          icon="share"
          title="Share code"
          description="Send your plan to a friend"
          onClick={() => setShareOpen(true)}
        />
      </div>
      </div>
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
