"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePlanState } from "@/hooks/use-plan";

/** The root layout applies this to every planner page, including new routes. */
export default function RequireSetup({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loaded, configured } = usePlanState();
  const needsSetup = pathname !== "/" && !configured;

  useEffect(() => {
    if (!loaded || !needsSetup) return;
    const destination = new URL(window.location.href);
    const query = new URLSearchParams();
    const share = destination.searchParams.get("share");
    if (share !== null) {
      query.set("share", share);
      destination.searchParams.delete("share");
    }
    query.set("next", destination.pathname + destination.search + destination.hash);
    router.replace(`/?${query}`);
  }, [loaded, needsSetup, pathname, router]);

  return needsSetup ? null : children;
}
