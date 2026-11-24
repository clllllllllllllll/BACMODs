"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Order is fixed by design.md §9: Timetable → Modules → Export.
const TABS = [
  { href: "/timetable", label: "Timetable" },
  { href: "/modules", label: "Modules" },
  { href: "/export", label: "Export" },
] as const;

/** `inline` is the desktop form that sits in the Header row; otherwise it is the second row. */
export default function TabBar({ inline = false }: { inline?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className={`flex gap-6 px-4 lg:px-0 ${inline ? "h-14" : "h-[41px]"}`}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`focus-ring flex items-center border-b-2 text-body-medium ${inline ? "border-t-2 border-t-transparent" : "-mb-px"} ${
              active
                ? "border-b-primary text-primary"
                : "border-b-transparent text-fg-secondary hover:text-fg"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
