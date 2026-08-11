"use client";

import { useEffect, useState } from "react";
import { ModelComparisonPanel } from "@/components/organisms/ModelComparisonPanel";
import { Spinner } from "@/components/ui/Spinner";
import { loadModels } from "@/lib/model";
import type { ModelMetadata } from "@/types/model";

export default function MethodologyPage() {
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);

  useEffect(() => {
    loadModels().then((m) => setMetadata(m.meta));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-up-primary">How this works</h1>
      <p className="mt-3 text-up-text-secondary">
        UrbanPrice estimates a property&apos;s value using two ensembled tree-based
        regression models — Random Forest and Gradient Boosting — trained offline in
        Python and shipped as static exported trees that run entirely in your browser.
        Comparing the two models against each other, on real evaluation metrics, is the
        methodology contribution here, not just a single black-box number.
      </p>

      <div className="mt-8">
        {!metadata && <Spinner label="Loading model metrics…" />}
        {metadata && <ModelComparisonPanel metadata={metadata} />}
      </div>

      <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-display text-lg font-semibold text-up-primary">
          Dataset disclosure
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-up-text-primary">
          This model is trained and validated on the Ames Housing dataset (Iowa, USA) as
          a methodology benchmark. Production deployment for a specific local market
          would require locally-sourced transaction data.
        </p>
        {metadata?.datasetSource.startsWith("SYNTHETIC") && (
          <p className="mt-3 text-sm leading-relaxed text-red-700">
            Note: the model currently shipped with this build was trained on a{" "}
            <strong>synthetic placeholder dataset</strong> shaped after Ames Housing, not
            the real Kaggle data — see README.md &quot;Replacing the placeholder
            model&quot; before using these numbers in a defense.
          </p>
        )}
      </div>
    </div>
  );
}
