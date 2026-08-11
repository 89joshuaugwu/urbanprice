// Expands the reduced ValuationForm inputs (top ~12 features, per
// CONTEXT.md Section 4) into the full ordered feature vector the trained
// model expects — every feature NOT on the form is filled with the
// dataset median (or, for Neighborhood, one-hot 0s except the selection).
import type { ModelMetadata } from "@/types/model";
import type { ValuationFormValues } from "@/types/valuation";

export function buildFeatureVector(
  metadata: ModelMetadata,
  values: ValuationFormValues
): number[] {
  return metadata.featureNames.map((name) => {
    if (name.startsWith("Neighborhood_")) {
      const selected = values["Neighborhood"];
      return selected && name === `Neighborhood_${selected}` ? 1 : 0;
    }
    const v = values[name];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    return metadata.featureMedians[name] ?? 0;
  });
}

// Human-readable labels + helper text for the top UI features. Falls back
// to the raw feature name for anything not listed here (keeps the UI
// working even if a retrain changes the top-feature list).
export const FEATURE_LABELS: Record<
  string,
  { label: string; help: string; unit?: string }
> = {
  OverallQual: {
    label: "Overall Quality",
    help: "Overall material and finish quality, 1 (poor) to 10 (excellent).",
  },
  GrLivArea: {
    label: "Living Area",
    help: "Above-ground living area.",
    unit: "sq ft",
  },
  GarageCars: {
    label: "Garage Capacity",
    help: "Size of garage in car capacity.",
    unit: "cars",
  },
  GarageArea: {
    label: "Garage Area",
    help: "Size of garage.",
    unit: "sq ft",
  },
  TotalBsmtSF: {
    label: "Total Basement Area",
    help: "Total square feet of basement area.",
    unit: "sq ft",
  },
  YearBuilt: {
    label: "Year Built",
    help: "Original construction year.",
  },
  YearRemodAdd: {
    label: "Year Remodeled",
    help: "Remodel year (same as YearBuilt if no remodel).",
  },
  FullBath: {
    label: "Full Bathrooms",
    help: "Full bathrooms above grade.",
    unit: "baths",
  },
  Neighborhood: {
    label: "Neighborhood",
    help: "Physical location within the city.",
  },
  LotArea: {
    label: "Lot Area",
    help: "Lot size.",
    unit: "sq ft",
  },
  "1stFlrSF": {
    label: "First Floor Area",
    help: "First floor square feet.",
    unit: "sq ft",
  },
  TotRmsAbvGrd: {
    label: "Total Rooms",
    help: "Total rooms above grade (does not include bathrooms).",
    unit: "rooms",
  },
  Fireplaces: {
    label: "Fireplaces",
    help: "Number of fireplaces.",
  },
};
