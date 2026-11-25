import type { ModuleColor } from "@/lib/schemas/plan";
import { MODULE_STYLES } from "@/components/ui/module-color";

/** Small module-coloured label, e.g. "LAB P3". Pass no colour for a neutral chip. */
export default function Chip({ color, children }: { color?: ModuleColor; children: React.ReactNode }) {
  const look = color ? `${MODULE_STYLES[color].tint} ${MODULE_STYLES[color].text}` : "bg-page text-fg-secondary";
  return <span className={`inline-flex items-center rounded-chip px-1.5 py-0.5 text-small-medium ${look}`}>{children}</span>;
}
