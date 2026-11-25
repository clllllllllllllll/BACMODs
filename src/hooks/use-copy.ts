"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

/** Copy text to the clipboard and say so in a toast. */
export function useCopy() {
  const toast = useToast();
  return useCallback(
    async (text: string, done: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast(done);
      } catch {
        toast("Couldn't copy. Select the text and copy it yourself.");
      }
    },
    [toast],
  );
}
