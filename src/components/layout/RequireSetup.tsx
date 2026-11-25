"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import { usePlanState } from "@/hooks/use-plan";

/** Gate the contents of a planner page after Next.js has rendered its route segment. */
export default function RequireSetup({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loaded, configured } = usePlanState();

  useEffect(() => {
    if (!loaded || configured) return;
    const destination = new URL(window.location.href);
    const query = new URLSearchParams();
    const share = destination.searchParams.get("share");
    if (share !== null) {
      query.set("share", share);
      destination.searchParams.delete("share");
    }
    query.set("next", destination.pathname + destination.search + destination.hash);
    router.replace(`/?${query}`);
  }, [loaded, configured, router]);

  return configured ? children : <Header showContext={false} />;
}
