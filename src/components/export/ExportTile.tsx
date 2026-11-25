import Icon, { type IconName } from "@/components/ui/Icon";

/** Tappable tile for one export route (calendar, share code). */
export default function ExportTile({
  icon,
  title,
  description,
  onClick,
  trailing = "chevron-right",
}: {
  icon: IconName;
  title: string;
  description: string;
  onClick: () => void;
  trailing?: IconName;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring flex w-full items-center gap-3 rounded-control border border-line bg-card px-4 py-3 text-left hover:bg-page"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-50 text-primary">
        <Icon name={icon} size={18} />
      </span>
      <span className="flex-1">
        <span className="block text-body-medium text-fg">{title}</span>
        <span className="block text-small text-fg-secondary">{description}</span>
      </span>
      <Icon name={trailing} className="text-fg-secondary" />
    </button>
  );
}
