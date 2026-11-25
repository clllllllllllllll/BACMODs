import type { ModuleColor } from "@/lib/schemas/plan";

/** Full class names so Tailwind can see them. Accent for dots/borders, text token for text. */
export const MODULE_STYLES: Record<ModuleColor, { dot: string; border: string; tint: string; text: string }> = {
  blue: { dot: "bg-module-blue", border: "border-module-blue", tint: "bg-module-blue-50", text: "text-module-blue-text" },
  purple: { dot: "bg-module-purple", border: "border-module-purple", tint: "bg-module-purple-50", text: "text-module-purple-text" },
  green: { dot: "bg-module-green", border: "border-module-green", tint: "bg-module-green-50", text: "text-module-green-text" },
  orange: { dot: "bg-module-orange", border: "border-module-orange", tint: "bg-module-orange-50", text: "text-module-orange-text" },
  pink: { dot: "bg-module-pink", border: "border-module-pink", tint: "bg-module-pink-50", text: "text-module-pink-text" },
  teal: { dot: "bg-module-teal", border: "border-module-teal", tint: "bg-module-teal-50", text: "text-module-teal-text" },
  slate: { dot: "bg-module-slate", border: "border-module-slate", tint: "bg-module-slate-50", text: "text-module-slate-text" },
};
