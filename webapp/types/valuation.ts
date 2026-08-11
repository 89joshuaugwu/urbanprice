export type ModelChoice = "randomForest" | "gradientBoosting";

export interface ConfidenceRange {
  low: number;
  high: number;
}

// Raw values collected from ValuationForm before being expanded into a
// full model feature vector (medians fill in everything not on the form).
export interface ValuationFormValues {
  [featureName: string]: number | string;
}

export interface ValuationResultData {
  rfEstimate: number;
  gbEstimate: number;
  confidenceRange: ConfidenceRange; // Random Forest only — see CONTEXT.md Section 6
  individualTreePredictions: number[];
  inputFeatures: Record<string, number | string>;
  modelUsed: ModelChoice;
}

export interface ComparableProperty {
  id: string;
  neighborhood: string; // Nigerian State
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  salePrice: number;
}

export interface SavedValuation {
  id?: string;
  uid: string | null;
  inputFeatures: Record<string, number | string>;
  estimate: number;
  confidenceRange: ConfidenceRange;
  modelUsed: ModelChoice;
  createdAt: number; // epoch ms
}
