"use client";

interface Option<T extends string> {
  value: T;
  label: string;
}

export default function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-control border border-line bg-page p-0.5">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.value)}
            className={`focus-ring h-8 min-w-16 flex-1 rounded-chip px-3 text-small-medium ${
              selected ? "bg-card text-fg shadow-small" : "text-fg-secondary"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
