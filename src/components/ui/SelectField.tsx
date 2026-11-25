import { useId, type SelectHTMLAttributes } from "react";
import Icon from "@/components/ui/Icon";

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: { value: string; label: string }[];
  helper?: string;
}

/** Native select (keyboard and screen readers for free) in the design field style. */
export default function SelectField({ label, options, helper, disabled, className, id, ...rest }: SelectFieldProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const helperId = helper ? `${fieldId}-help` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={fieldId} className="text-label uppercase text-fg-secondary">
        {label}
      </label>
      <div className="relative">
        <select
          id={fieldId}
          disabled={disabled}
          aria-describedby={helperId}
          className={`field-focus h-10 w-full appearance-none rounded-control border border-line px-3 pr-9 text-body ${
            disabled ? "bg-page text-fg-tertiary" : "bg-card text-fg"
          }`}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          className={`pointer-events-none absolute right-3 top-3 ${disabled ? "text-fg-tertiary" : "text-fg-secondary"}`}
        />
      </div>
      {helper ? (
        <p id={helperId} className="text-small text-fg-secondary">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
