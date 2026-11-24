"use client";

import { useEffect, useId, useRef } from "react";
import { useToastDialog } from "@/components/ui/Toast";

/**
 * Modal bottom sheet on the native dialog element: the browser traps focus, closes on Esc and
 * returns focus to the trigger. `radius` is the top-corner class (Setup sheet 12 px, Share sheet 16 px).
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  radius = "rounded-t-sheet lg:rounded-sheet",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  radius?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const setToastDialog = useToastDialog();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      setToastDialog(dialog);
      return () => setToastDialog((current) => current === dialog ? null : current);
    }
    if (dialog.open) dialog.close();
  }, [open, setToastDialog]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`sheet ${radius}`}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="px-4 pb-6 pt-2 lg:px-6 lg:pt-5">
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-handle bg-line lg:hidden" />
        <h2 id={titleId} className="mb-4 text-heading">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
