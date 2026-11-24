"use client";

import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useCopy } from "@/hooks/use-copy";
import { MOCK_SHARE_CODE } from "@/lib/mock/dataset";

/** Share sheet: a code and a link. The code is a mock until share-code storage exists (M6). */
export default function ShareSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const copy = useCopy();
  const path = `/?share=${MOCK_SHARE_CODE}`;
  return (
    <BottomSheet open={open} onClose={onClose} title="Share your plan" radius="rounded-t-share lg:rounded-share">
      <div className="flex flex-col gap-4">
        <p className="text-body text-fg-secondary">Anyone with this code can load your sections. No personal data is shared.</p>
        <div className="flex flex-col gap-1.5">
          <span className="text-label uppercase text-fg-secondary">Share code</span>
          <p className="rounded-control border border-line bg-page px-3 py-2.5 text-heading tracking-wide">
            {MOCK_SHARE_CODE}
          </p>
        </div>
        <Button fullWidth onClick={() => copy(MOCK_SHARE_CODE, "Share code copied")}>
          <Icon name="copy" />
          Copy share code
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => copy(`${window.location.origin}${path}`, "Link copied")}
        >
          <Icon name="link" />
          Copy link
        </Button>
        <p className="text-small text-fg-secondary">Sample code for the preview. Real codes arrive with sharing.</p>
      </div>
    </BottomSheet>
  );
}
