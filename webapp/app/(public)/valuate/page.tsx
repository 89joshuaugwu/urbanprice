"use client";

import { useEffect, useState } from "react";
import { ValuationForm } from "@/components/organisms/ValuationForm";
import { ValuationResult } from "@/components/organisms/ValuationResult";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { loadModels } from "@/lib/model";
import { predictRandomForest, predictGradientBoosting } from "@/lib/inference";
import { computeConfidenceRange } from "@/lib/confidence";
import { buildFeatureVector } from "@/lib/features";
import { saveValuation } from "@/lib/valuations";
import { onAuthChange } from "@/lib/auth";
import type { ModelMetadata, RandomForestModel, GradientBoostingModel } from "@/types/model";
import type { ValuationFormValues, ValuationResultData } from "@/types/valuation";
import type { User } from "firebase/auth";

export default function ValuatePage() {
  const [models, setModels] = useState<{
    rf: RandomForestModel;
    gb: GradientBoostingModel;
    meta: ModelMetadata;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ValuationResultData | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadModels()
      .then(setModels)
      .catch((err) => setLoadError(err.message ?? "Failed to load the model."));
  }, []);

  useEffect(() => onAuthChange(setUser), []);

  const handleSubmit = async (values: ValuationFormValues) => {
    if (!models) return;
    setSubmitting(true);
    try {
      const featureVector = buildFeatureVector(models.meta, values);
      const { estimate: rfEstimate, predictions } = predictRandomForest(models.rf, featureVector);
      const gbEstimate = predictGradientBoosting(models.gb, featureVector);
      const confidenceRange = computeConfidenceRange(predictions);

      const resultData: ValuationResultData = {
        rfEstimate,
        gbEstimate,
        confidenceRange,
        individualTreePredictions: predictions,
        inputFeatures: values,
        modelUsed: "randomForest",
      };
      setResult(resultData);

      if (user) {
        await saveValuation({
          uid: user.uid,
          inputFeatures: values,
          estimate: rfEstimate,
          confidenceRange,
          modelUsed: "randomForest",
        });
      }
    } catch (err) {
      console.error(err);
      Toast.error("Something went wrong computing that estimate.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-up-primary">Get an estimate</h1>
      <p className="mt-2 text-up-text-secondary">
        Fill in the property details below — everything else is filled in from the
        training dataset&apos;s typical values.
      </p>

      <div className="mt-8">
        {loadError && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </p>
        )}
        {!loadError && !models && <Spinner label="Loading the trained model…" />}
        {models && !result && (
          <ValuationForm metadata={models.meta} submitting={submitting} onSubmit={handleSubmit} />
        )}
        {models && result && (
          <ValuationResult result={result} loggedIn={Boolean(user)} onReset={() => setResult(null)} />
        )}
      </div>
    </div>
  );
}
