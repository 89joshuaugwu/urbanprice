import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

const VARIANTS: Record<string, string> = {
  primary: "bg-up-primary text-white hover:bg-slate-800 disabled:bg-slate-400",
  secondary:
    "bg-white text-up-primary border border-up-border hover:bg-slate-50 disabled:opacity-50",
  ghost: "bg-transparent text-up-primary hover:bg-slate-100 disabled:opacity-50",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold text-sm transition-colors min-h-12 ${VARIANTS[variant]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
