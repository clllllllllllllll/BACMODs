import Icon, { type IconName } from "@/components/ui/Icon";

export type BannerVariant = "success" | "info" | "warning" | "error";

const LOOK: Record<BannerVariant, { classes: string; icon: IconName }> = {
  success: { classes: "bg-success-50 text-success-text", icon: "check" },
  info: { classes: "bg-primary-50 text-primary", icon: "alert-circle" },
  warning: { classes: "bg-warning-50 text-warning", icon: "alert-circle" },
  error: { classes: "bg-danger-50 text-danger-text", icon: "alert-circle" },
};

export default function Banner({
  variant = "info",
  children,
  action,
}: {
  variant?: BannerVariant;
  children: React.ReactNode;
  /** Optional link or button, shown after the message. */
  action?: React.ReactNode;
}) {
  const { classes, icon } = LOOK[variant];
  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-control px-3 py-2.5 text-small-medium ${classes}`}
    >
      <Icon name={icon} className="mt-0.5" />
      <div className="flex flex-1 flex-wrap items-center gap-x-2">
        <span>{children}</span>
        {action}
      </div>
    </div>
  );
}
