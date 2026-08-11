import { Loader2 } from "lucide-react";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-up-text-secondary">
      <Loader2 className="h-8 w-8 animate-spin text-up-primary" aria-hidden />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
