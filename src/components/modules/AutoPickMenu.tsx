"use client";

import { useEffect, useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

const OPTIONS = [
  "Fewest days on campus",
  "Start late (nothing before 10:00)",
  "Finish early (nothing after 16:00)",
] as const;

/**
 * Auto-pick dropdown. The search itself arrives in M5, so choosing an option only says so.
 */
export default function AutoPickMenu() {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const items = () => Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    items()[0]?.focus();
    const close = (refocus: boolean) => {
      setOpen(false);
      if (refocus) trigger.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const list = items();
        const i = list.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
        list[next]?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <Button
        ref={trigger}
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        Auto-pick
        <Icon name={open ? "chevron-up" : "chevron-down"} size={14} />
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Auto-pick options"
          className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-control border border-line bg-card py-1 shadow-popover"
        >
          {OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
                toast("Auto-pick is coming soon. Your sections were not changed.");
              }}
              className="focus-ring block w-full px-3 py-2 text-left text-body text-fg hover:bg-page"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
