import Icon from "@/components/ui/Icon";

type Status = "fits" | "clash" | "in-plan" | "addable" | "upcoming";

const LOOK: Record<Status, { label: string; classes: string; icon?: "check" | "alert-circle" | "plus" }> = {
  fits: { label: "Fits", classes: "bg-success-50 text-success-text", icon: "check" },
  clash: { label: "Clash", classes: "bg-danger-50 text-danger-text", icon: "alert-circle" },
  "in-plan": { label: "In plan", classes: "bg-primary-50 text-primary", icon: "check" },
  addable: { label: "Addable", classes: "bg-primary-50 text-primary", icon: "plus" },
  upcoming: { label: "Upcoming", classes: "bg-primary-50 text-primary" },
};

/** Pill with an icon and a word, so status never relies on colour alone. */
export default function StatusBadge({ status }: { status: Status }) {
  const { label, classes, icon } = LOOK[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro ${classes}`}>
      {icon ? <Icon name={icon} size={10} /> : null}
      {label}
    </span>
  );
}
