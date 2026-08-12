// Expands the ValuationForm inputs into the full ordered feature vector
// the trained model expects. Every source feature on this dataset is
// exposed on the form (there's nothing left over to backfill with
// medians, unlike the earlier Ames-based version of this app) — but the
// median fallback stays in place for robustness if the model is retrained
// with extra features later.
import type { ModelMetadata } from "@/types/model";
import type { ValuationFormValues } from "@/types/valuation";

export function buildFeatureVector(
  metadata: ModelMetadata,
  values: ValuationFormValues
): number[] {
  const categoricalPrefixes = Object.keys(metadata.categoricalFeatures ?? {});

  return metadata.featureNames.map((name) => {
    const matchedPrefix = categoricalPrefixes.find((p) => name.startsWith(`${p}_`));
    if (matchedPrefix) {
      const selected = values[matchedPrefix];
      return selected && name === `${matchedPrefix}_${selected}` ? 1 : 0;
    }
    const v = values[name];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    return metadata.featureMedians[name] ?? 0;
  });
}

// Human-readable labels + helper text for the Nigeria feature set.
export const FEATURE_LABELS: Record<
  string,
  { label: string; help: string; unit?: string }
> = {
  Bedrooms: {
    label: "Bedrooms",
    help: "Number of bedrooms.",
  },
  Bathrooms: {
    label: "Bathrooms",
    help: "Number of bathrooms.",
  },
  Toilets: {
    label: "Toilets",
    help: "Number of toilets (may exceed bathrooms in Nigerian listings).",
  },
  ParkingSpace: {
    label: "Parking Spaces",
    help: "Number of dedicated parking spaces.",
  },
  State: {
    label: "State",
    help: "Nigerian state the property is located in.",
  },
  Town: {
    label: "Town / Area",
    help: "Specific town or area — the most common ones are listed by name; less common areas are grouped as \"Other\".",
  },
  PropertyType: {
    label: "Property Type",
    help: "The building type — duplex, bungalow, flat, etc.",
  },
};
