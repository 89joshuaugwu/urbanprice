"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MetricCard } from "@/components/molecules/MetricCard";
import type { ModelMetadata } from "@/types/model";

export function ModelComparisonPanel({ metadata }: { metadata: ModelMetadata }) {
  const importanceData = Object.entries(metadata.featureImportances)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, importance: Number((value * 100).toFixed(1)) }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard title="Random Forest" metrics={metadata.metrics.randomForest} />
        <MetricCard title="Gradient Boosting" metrics={metadata.metrics.gradientBoosting} />
      </div>

      <div>
        <h3 className="font-display mb-4 text-lg font-semibold text-up-primary">
          Feature importance (Random Forest)
        </h3>
        <div className="h-80 w-full rounded-2xl border border-up-border bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={importanceData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 12, fill: "#64748B" }}
              />
              <Tooltip formatter={(v) => [`${v}%`, "Importance"]} />
              <Bar dataKey="importance" fill="#059669" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
