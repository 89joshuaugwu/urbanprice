#!/usr/bin/env node
// Phase 2 correctness check (PROMPT.md): confirms the TypeScript inference
// engine reproduces the original Python model's predictions for the same
// feature rows. This mirrors lib/inference.ts exactly (kept in plain JS
// here so it can run standalone with `node`, no build step required).
//
// Usage: npm run verify

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelDir = path.join(__dirname, "..", "public", "model");

function predictTree(tree, features) {
  let nodeIdx = 0;
  while (tree[nodeIdx].featureIndex !== -1) {
    const node = tree[nodeIdx];
    nodeIdx = features[node.featureIndex] <= node.threshold ? node.left : node.right;
  }
  return tree[nodeIdx].value;
}

function predictRandomForest(model, features) {
  const predictions = model.trees.map((t) => predictTree(t, features));
  const estimate = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  return { estimate, predictions };
}

function predictGradientBoosting(model, features) {
  return model.trees.reduce(
    (acc, tree) => acc + model.learningRate * predictTree(tree, features),
    model.initValue
  );
}

async function main() {
  const [rf, gb, samples] = await Promise.all([
    readFile(path.join(modelDir, "random_forest.json"), "utf-8").then(JSON.parse),
    readFile(path.join(modelDir, "gradient_boosting.json"), "utf-8").then(JSON.parse),
    readFile(path.join(modelDir, "verification_samples.json"), "utf-8").then(JSON.parse),
  ]);

  let allPassed = true;
  const TOLERANCE = 1.0; // dollars; float rounding only, per PROMPT.md Phase 2

  console.log(`Verifying ${samples.length} sample rows against Python's real predictions...\n`);

  samples.forEach((sample, i) => {
    const featureVector = rf.featureNames.map((name) => sample.features[name]);
    const { estimate: rfTs } = predictRandomForest(rf, featureVector);
    const gbTs = predictGradientBoosting(gb, featureVector);

    const rfDiff = Math.abs(rfTs - sample.rfPrediction);
    const gbDiff = Math.abs(gbTs - sample.gbPrediction);
    const rfOk = rfDiff < TOLERANCE;
    const gbOk = gbDiff < TOLERANCE;
    if (!rfOk || !gbOk) allPassed = false;

    console.log(`Row ${i + 1}:`);
    console.log(`  Random Forest   — Python: ${sample.rfPrediction.toFixed(2)}  TS: ${rfTs.toFixed(2)}  diff: ${rfDiff.toFixed(4)}  ${rfOk ? "OK" : "MISMATCH"}`);
    console.log(`  Gradient Boost. — Python: ${sample.gbPrediction.toFixed(2)}  TS: ${gbTs.toFixed(2)}  diff: ${gbDiff.toFixed(4)}  ${gbOk ? "OK" : "MISMATCH"}`);
  });

  console.log(`\n${allPassed ? "PASSED" : "FAILED"} — TypeScript inference ${allPassed ? "matches" : "does NOT match"} Python model output.`);
  if (!allPassed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
