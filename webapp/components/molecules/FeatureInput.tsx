"use client";

import { Slider } from "@/components/ui/Slider";
import { Select } from "@/components/ui/Select";
import { FEATURE_LABELS } from "@/lib/features";
import { formatNumber } from "@/lib/format";
import type { ModelMetadata } from "@/types/model";

interface FeatureInputProps {
  name: string;
  value: number | string;
  metadata: ModelMetadata;
  onChange: (name: string, value: number | string) => void;
}

export function FeatureInput({ name, value, metadata, onChange }: FeatureInputProps) {
  const meta = FEATURE_LABELS[name] ?? { label: name, help: "" };

  if (name === "State") {
    return (
      <div>
        <Select
          id={`feature-${name}`}
          label={meta.label}
          value={String(value)}
          onChange={(e) => onChange(name, e.target.value)}
          options={metadata.neighborhoods.map((n) => ({ value: n, label: n }))}
        />
        <p className="mt-1 text-xs text-up-text-secondary">{meta.help}</p>
      </div>
    );
  }

  if (name === "PropertyType") {
    return (
      <div>
        <Select
          id={`feature-${name}`}
          label={meta.label}
          value={String(value)}
          onChange={(e) => onChange(name, e.target.value)}
          options={metadata.propertyTypes.map((n) => ({ value: n, label: n }))}
        />
        <p className="mt-1 text-xs text-up-text-secondary">{meta.help}</p>
      </div>
    );
  }

  const range = metadata.uiRanges[name];
  const min = range?.min ?? 0;
  const max = range?.max ?? 10;
  const step = 1; // Bedrooms/Bathrooms/Toilets/ParkingSpace are all whole numbers
  const numericValue = typeof value === "number" ? value : Number(value) || min;

  return (
    <div>
      <Slider
        id={`feature-${name}`}
        label={meta.label}
        valueLabel={`${formatNumber(numericValue)}${meta.unit ? ` ${meta.unit}` : ""}`}
        min={min}
        max={max}
        step={step}
        value={numericValue}
        onChange={(e) => onChange(name, Number(e.target.value))}
      />
      <div className="mt-1 flex items-center justify-between text-xs text-up-text-secondary">
        <span>{meta.help}</span>
        <span className="font-data">
          {formatNumber(min)}–{formatNumber(max)}
        </span>
      </div>
    </div>
  );
}
