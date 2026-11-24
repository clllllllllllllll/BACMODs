"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
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
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function closeAndFocusTrigger() {
    setOpen(false);
    trigger.current?.focus();
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!open) return;
    if (event.key === "Escape" || (event.key === "Tab" && event.shiftKey && event.target !== trigger.current)) {
      event.preventDefault();
      closeAndFocusTrigger();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const focused = items.findIndex((item) => item === event.target);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const next = focused === -1 ? (direction === 1 ? 0 : items.length - 1) : (focused + direction + items.length) % items.length;
    event.preventDefault();
    items[next]?.focus();
  }

  return (
    <div
      ref={root}
      className="relative"
      onKeyDown={handleKey}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
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
          ref={menu}
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
              tabIndex={-1}
              onClick={() => {
                closeAndFocusTrigger();
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
