"use client";

import { useSyncExternalStore } from "react";

export const OFFLINE_MESSAGE = "You're offline. Showing saved timetable";

function subscribe(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

export function useIsOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
