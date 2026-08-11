// CONTEXT.md Section 6 — confidence range from ensemble spread.
// Valid for Random Forest only (independent trees). Gradient Boosting's
// trees are sequential error-correctors, so they don't carry the same
// spread-as-uncertainty property — do not call this on GB predictions.
export function computeConfidenceRange(predictions: number[]): {
  low: number;
  high: number;
} {
  const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const variance =
    predictions.reduce((sum, p) => sum + (p - mean) ** 2, 0) / predictions.length;
  const stdDev = Math.sqrt(variance);
  return { low: mean - stdDev, high: mean + stdDev };
}
