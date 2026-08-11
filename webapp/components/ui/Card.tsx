import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-up-border bg-up-card p-6 shadow-sm ${className}`}
      {...props}
    />
  );
}
