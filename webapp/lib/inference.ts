// UrbanPrice inference engine — implements CONTEXT.md Section 5 exactly.
// This is the load-bearing correctness surface of the whole app: it must
// reproduce the Python model's .predict() output for the same feature
// vector. See lib/verify.ts and app/(public)/methodology's verification
// note for how this is checked against training/verification_samples.json.

import type { TreeNode } from "@/types/model";

export function predictTree(tree: TreeNode[], features: number[]): number {
  let nodeIdx = 0;
  while (tree[nodeIdx].featureIndex !== -1) {
    const node = tree[nodeIdx];
    nodeIdx = features[node.featureIndex] <= node.threshold ? node.left : node.right;
  }
  return tree[nodeIdx].value;
}

export function predictRandomForest(
  model: { trees: TreeNode[][] },
  features: number[]
): { estimate: number; predictions: number[] } {
  const predictions = model.trees.map((t) => predictTree(t, features));
  const estimate = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  return { estimate, predictions };
}

export function predictGradientBoosting(
  model: { trees: TreeNode[][]; learningRate: number; initValue: number },
  features: number[]
): number {
  return model.trees.reduce(
    (acc, tree) => acc + model.learningRate * predictTree(tree, features),
    model.initValue
  );
}
