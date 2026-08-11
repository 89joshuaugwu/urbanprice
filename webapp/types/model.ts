// Matches CONTEXT.md Section 5's TreeNode interface exactly.
export interface TreeNode {
  featureIndex: number; // -1 if leaf
  threshold: number;
  left: number;
  right: number;
  value: number;
}

export interface RandomForestModel {
  trees: TreeNode[][];
  featureNames: string[];
}

export interface GradientBoostingModel {
  trees: TreeNode[][];
  learningRate: number;
  initValue: number;
  featureNames: string[];
}

export interface ModelMetrics {
  rmse: number;
  mae: number;
  r2: number;
}

export interface ModelMetadata {
  trainedAt: string;
  datasetSource: string;
  sampleCount: number;
  trainTestSplit: { train: number; test: number };
  metrics: {
    randomForest: ModelMetrics;
    gradientBoosting: ModelMetrics;
  };
  featureImportances: Record<string, number>;
  topUiFeatures: string[];
  featureMedians: Record<string, number>;
  uiRanges: Record<string, { min: number; max: number }>;
  neighborhoods: string[]; // Nigerian States — kept as "neighborhoods" for schema stability
  propertyTypes: string[];
  currency: string; // e.g. "NGN"
  targetTransform: "identity" | "log1p";
  featureNames: string[];
  categoricalFeatures: Record<string, string>; // e.g. { State: "State", PropertyType: "PropertyType" }
}

export interface VerificationSample {
  features: Record<string, number>;
  rfPrediction: number;
  gbPrediction: number;
  actualSalePrice: number;
}
