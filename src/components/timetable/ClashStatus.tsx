import Icon from "@/components/ui/Icon";

/** Summary of clashes in the plan. The words stay visible alongside the colour. */
export default function ClashStatus({ count }: { count: number }) {
  const clash = count > 0;
  return (
    <p
      role="status"
      className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-small-medium ${
        clash ? "bg-danger-50 text-danger-text" : "bg-success-50 text-success-text"
      }`}
    >
      <Icon name={clash ? "alert-circle" : "check"} size={14} />
      {clash ? `Clash: ${count} ${count === 1 ? "overlap" : "overlaps"} in your plan` : "OK: no clashes"}
    </p>
  );
}
