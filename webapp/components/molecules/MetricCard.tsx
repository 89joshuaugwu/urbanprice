import { Card } from "@/components/ui/Card";
import type { ModelMetrics } from "@/types/model";

export function MetricCard({ title, metrics }: { title: string; metrics: ModelMetrics }) {
  return (
    <Card>
      <h3 className="font-display text-base font-semibold text-up-primary">{title}</h3>
      <dl className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-up-text-secondary">RMSE</dt>
          <dd className="font-data text-sm font-medium">₦{Math.round(metrics.rmse).toLocaleString()}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-sm text-up-text-secondary">MAE</dt>
          <dd className="font-data text-sm font-medium">₦{Math.round(metrics.mae).toLocaleString()}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-sm text-up-text-secondary">R²</dt>
          <dd className="font-data text-sm font-medium">{metrics.r2.toFixed(3)}</dd>
        </div>
      </dl>
    </Card>
  );
}
