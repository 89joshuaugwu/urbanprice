"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EnsembleReveal } from "@/components/molecules/EnsembleReveal";
import { EstimateDisplay } from "@/components/molecules/EstimateDisplay";
import { ComparablePropertyCard } from "@/components/molecules/ComparablePropertyCard";
import { Button } from "@/components/ui/Button";
import { findComparables } from "@/lib/comparables";
import { firebaseEnabled } from "@/lib/firebase";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";
import type { ValuationResultData, ComparableProperty } from "@/types/valuation";

interface ValuationResultProps {
  result: ValuationResultData;
  loggedIn: boolean;
  onReset: () => void;
}

export function ValuationResult({ result, loggedIn, onReset }: ValuationResultProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const isRevealed = revealed || reducedMotion;
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);

  useEffect(() => {
    const bedrooms = Number(result.inputFeatures["Bedrooms"]) || 4;
    const bathrooms = Number(result.inputFeatures["Bathrooms"]) || 4;
    const state = String(result.inputFeatures["State"] ?? "");
    const propertyType = String(result.inputFeatures["PropertyType"] ?? "");
    findComparables({ bedrooms, bathrooms, state, propertyType }).then(setComparables);
  }, [result.inputFeatures]);

  return (
    <div className="space-y-10">
      {!isRevealed ? (
        <EnsembleReveal onComplete={() => setRevealed(true)} />
      ) : (
        <EstimateDisplay
          estimate={result.rfEstimate}
          low={result.confidenceRange.low}
          high={result.confidenceRange.high}
          animate={!reducedMotion}
        />
      )}

      {isRevealed && (
        <>
          <div>
            <h3 className="font-display mb-4 text-lg font-semibold text-up-primary">
              Similar properties
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {comparables.map((c) => (
                <ComparablePropertyCard key={c.id} property={c} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-up-border bg-white p-4 text-sm text-up-text-secondary">
            {firebaseEnabled ? (
              loggedIn ? (
                "Saved to your history."
              ) : (
                <>
                  <Link href="/auth/login" className="font-medium text-up-primary underline">
                    Log in
                  </Link>{" "}
                  to save this estimate to your history.
                </>
              )
            ) : (
              "History isn't enabled on this deployment — this estimate isn't saved anywhere."
            )}
          </div>

          <Button variant="secondary" onClick={onReset} className="w-full">
            Run another valuation
          </Button>
        </>
      )}
    </div>
  );
}
