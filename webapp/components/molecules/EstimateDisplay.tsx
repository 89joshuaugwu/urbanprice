"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";

interface EstimateDisplayProps {
  estimate: number;
  low: number;
  high: number;
  animate: boolean;
}

// Counts the headline figure up to its final value, then fades in the
// amber confidence band — DESIGN.md Section 1's "Ensemble Reveal" payoff.
export function EstimateDisplay({ estimate, low, high, animate }: EstimateDisplayProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : estimate);
  const [bandVisible, setBandVisible] = useState(!animate);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!animate) return;
    const duration = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(estimate * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setBandVisible(true);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [estimate, animate]);

  return (
    <div className="text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-up-text-secondary">
        Estimated value
      </p>
      <p className="font-display mt-2 text-5xl font-bold text-up-accent sm:text-6xl">
        {formatCurrency(displayValue)}
      </p>
      <div
        className={`mx-auto mt-6 max-w-sm rounded-full bg-up-confidence/25 px-4 py-2 text-sm text-up-text-primary transition-opacity duration-500 ${
          bandVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        Likely between{" "}
        <span className="font-data font-semibold">{formatCurrency(low)}</span> and{" "}
        <span className="font-data font-semibold">{formatCurrency(high)}</span>
      </div>
    </div>
  );
}
