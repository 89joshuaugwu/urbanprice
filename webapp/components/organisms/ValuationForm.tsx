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
  const defaultState = metadata.neighborhoods[0];
  for (const name of metadata.topUiFeatures) {
    if (name === "State") {
      values[name] = defaultState;
    } else if (name === "Town") {
      // Town is scoped to State — seed it with that state's first town.
      values[name] = metadata.townsByState[defaultState]?.[0] ?? metadata.towns[0];
    } else if (name === "PropertyType") {
      values[name] = metadata.propertyTypes[0];
    } else {
      values[name] = metadata.featureMedians[name] ?? metadata.uiRanges[name]?.min ?? 0;
    }
  }
  return values;
}

// metadata.topUiFeatures is ordered by statistical importance (Town often
// outranks State), but the Town dropdown is scoped to whichever State is
// selected — so State must always render before Town regardless of where
// importance ranking would otherwise place it.
function orderedFieldNames(metadata: ModelMetadata): string[] {
  const fields = [...metadata.topUiFeatures];
  const stateIdx = fields.indexOf("State");
  const townIdx = fields.indexOf("Town");
  if (stateIdx !== -1 && townIdx !== -1 && stateIdx > townIdx) {
    fields.splice(stateIdx, 1);
    fields.splice(townIdx, 0, "State");
  }
  return fields;
}

export function ValuationForm({ metadata, submitting, onSubmit }: ValuationFormProps) {
  const [values, setValues] = useState<ValuationFormValues>(() => defaultValues(metadata));

  const handleChange = (name: string, value: number | string) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      // Changing State can orphan the currently-selected Town (it may not
      // exist in the new state's list) — snap it to the new state's first
      // town automatically so the form is never left in an inconsistent
      // state/town combination.
      if (name === "State" && metadata.topUiFeatures.includes("Town")) {
        const townsForState = metadata.townsByState[String(value)];
        next["Town"] = townsForState?.[0] ?? metadata.towns[0];
      }
      return next;
    });
  };

  const allFilled = metadata.topUiFeatures.every(
    (name) => values[name] !== undefined && values[name] !== ""
  );

  const fieldOrder = orderedFieldNames(metadata);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {fieldOrder.map((name) => (
          <FeatureInput
            key={name}
            name={name}
            value={values[name]}
            metadata={metadata}
            selectedState={values["State"] ? String(values["State"]) : undefined}
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
