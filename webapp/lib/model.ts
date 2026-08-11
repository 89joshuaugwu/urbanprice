"use client";

// Loads the three static model artifacts from /public/model/ and caches
// them in memory for the session (they don't change without a redeploy).
import type { RandomForestModel, GradientBoostingModel, ModelMetadata } from "@/types/model";

interface ModelBundle {
  rf: RandomForestModel;
  gb: GradientBoostingModel;
  meta: ModelMetadata;
}

let cache: ModelBundle | null = null;
let inflight: Promise<ModelBundle> | null = null;

export async function loadModels(): Promise<ModelBundle> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const [rf, gb, meta] = await Promise.all([
      fetch("/model/random_forest.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load random_forest.json");
        return r.json();
      }) as Promise<RandomForestModel>,
      fetch("/model/gradient_boosting.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load gradient_boosting.json");
        return r.json();
      }) as Promise<GradientBoostingModel>,
      fetch("/model/model_metadata.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load model_metadata.json");
        return r.json();
      }) as Promise<ModelMetadata>,
    ]);
    cache = { rf, gb, meta };
    return cache;
  })();

  return inflight;
}
