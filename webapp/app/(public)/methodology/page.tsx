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
          This model is trained on {metadata ? metadata.sampleCount.toLocaleString() : "24,000+"}{" "}
          real Nigerian property listings spanning {metadata?.neighborhoods.length ?? 25}{" "}
          states — bedrooms, bathrooms, toilets, parking spaces, property type, and
          asking price. It is intentionally not a generic international benchmark
          dataset; every prediction below reflects the Nigerian housing market it was
          trained on.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-up-text-primary">
          <strong>Important limitation:</strong> this dataset captures listing (asking)
          prices scraped from property portals, not verified completed-sale records —
          asking prices can run higher than what a property actually sells for. It also
          has no square footage, exact location, or condition data, which limits how
          precise a single estimate can be; that&apos;s reflected honestly in the R² and
          confidence range below rather than hidden.
        </p>
      </div>
    </div>
  );
}
