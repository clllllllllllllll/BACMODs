import { useId, type InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: string;
  /** Error message: keeps the entered value, turns the border red and is announced. */
  error?: string;
}

export default function TextInput({ label, helper, error, className, id, ...rest }: TextInputProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const noteId = error || helper ? `${fieldId}-note` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={fieldId} className="text-label uppercase text-fg-secondary">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={noteId}
        className={`field-focus h-10 w-full rounded-control border bg-card px-3 text-body text-fg placeholder:text-fg-tertiary disabled:bg-page disabled:text-fg-tertiary ${
          error ? "border-danger" : "border-line"
        }`}
        {...rest}
      />
      {error ? (
        <p id={noteId} role="alert" className="text-small text-danger">
          {error}
        </p>
      ) : helper ? (
        <p id={noteId} className="text-small text-fg-secondary">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
