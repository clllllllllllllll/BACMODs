import type { ComponentPropsWithRef } from "react";

type Variant = "primary" | "secondary";
type Size = "default" | "large";

/** Class names are exported so a Next `Link` can look like a Button. */
export function buttonClasses(variant: Variant = "primary", size: Size = "default", fullWidth = false): string {
  const base =
    "focus-ring inline-flex items-center justify-center gap-2 rounded-control px-4 text-body-medium transition-colors disabled:opacity-40";
  const height = size === "large" ? "h-12" : "h-9";
  const look =
    variant === "primary"
      ? "bg-primary text-on-primary active:opacity-85"
      : "border border-line bg-card text-fg hover:bg-page active:bg-page";
  return `${base} ${height} ${look} ${fullWidth ? "w-full" : ""}`;
}

type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

export default function Button({ variant, size, fullWidth, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`${buttonClasses(variant, size, fullWidth)} ${className ?? ""}`} {...rest} />;
}
