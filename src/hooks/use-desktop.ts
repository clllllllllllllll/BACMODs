"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1024px)";

function subscribe(listener: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", listener);
  return () => mql.removeEventListener("change", listener);
}

/** True at the desktop breakpoint (1024 px and up). The server and first render say false. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
