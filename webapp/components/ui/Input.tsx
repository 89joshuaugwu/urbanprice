import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  unit?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, unit, id, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-up-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            className={`w-full rounded-lg border border-up-border bg-white px-4 py-3 text-base text-up-text-primary outline-none transition-colors focus:border-up-primary focus:ring-2 focus:ring-up-primary/20 ${
              unit ? "pr-16" : ""
            } ${error ? "border-red-400" : ""} ${className}`}
            {...props}
          />
          {unit && (
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-up-text-secondary">
              {unit}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
