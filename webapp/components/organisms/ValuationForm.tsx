"use client";

import { useState } from "react";
import { FeatureInput } from "@/components/molecules/FeatureInput";
import { Button } from "@/components/ui/Button";
import type { ModelMetadata } from "@/types/model";
import type { ValuationFormValues } from "@/types/valuation";

interface ValuationFormProps {
  metadata: ModelMetadata;
  submitting: boolean;
  onSubmit: (values: ValuationFormValues) => void;
}

function defaultValues(metadata: ModelMetadata): ValuationFormValues {
  const values: ValuationFormValues = {};
  for (const name of metadata.topUiFeatures) {
    if (name === "Neighborhood") {
      values[name] = metadata.neighborhoods[0];
    } else {
      values[name] = metadata.featureMedians[name] ?? metadata.uiRanges[name]?.min ?? 0;
    }
  }
  return values;
}

export function ValuationForm({ metadata, submitting, onSubmit }: ValuationFormProps) {
  const [values, setValues] = useState<ValuationFormValues>(() => defaultValues(metadata));

  const handleChange = (name: string, value: number | string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const allFilled = metadata.topUiFeatures.every(
    (name) => values[name] !== undefined && values[name] !== ""
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {metadata.topUiFeatures.map((name) => (
          <FeatureInput
            key={name}
            name={name}
            value={values[name]}
            metadata={metadata}
            onChange={handleChange}
          />
        ))}
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-up-border bg-up-background/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" className="w-full" loading={submitting} disabled={!allFilled}>
          Get Estimate
        </Button>
        {!allFilled && (
          <p className="mt-2 text-center text-xs text-up-text-secondary">
            Fill in every field to get an estimate.
          </p>
        )}
      </div>
    </form>
  );
}
