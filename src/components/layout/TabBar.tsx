"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Order is fixed by design.md §9: Timetable → Modules → Export.
const TABS = [
  { href: "/timetable", label: "Timetable" },
  { href: "/modules", label: "Modules" },
  { href: "/export", label: "Export" },
] as const;

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex h-[41px] gap-6 border-b border-line bg-card px-4">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`focus-ring -mb-px flex items-center border-b-2 text-body-medium ${
              active ? "border-primary text-primary" : "border-transparent text-fg-secondary"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
