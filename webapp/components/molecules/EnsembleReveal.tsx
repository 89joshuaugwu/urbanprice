"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

interface EnsembleRevealProps {
  onComplete: () => void;
}

const BRANCH_COUNT = 7;

// The signature moment (DESIGN.md Section 1): abstract branching paths,
// each representing one decision tree in the ensemble, animate in and
// settle at slightly different points, then converge — an honest
// visualization of what an ensemble actually does, not a generic spinner.
export function EnsembleReveal({ onComplete }: EnsembleRevealProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<"branching" | "converging" | "done">("branching");

  useEffect(() => {
    if (reducedMotion) {
      onComplete();
      return;
    }
    const t1 = setTimeout(() => setPhase("converging"), 900);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  if (reducedMotion) return null;

  const endXs = Array.from({ length: BRANCH_COUNT }, (_, i) => {
    const spread = (i - (BRANCH_COUNT - 1) / 2) * 22;
    return phase === "converging" ? 0 : spread;
  });

  return (
    <div className="flex flex-col items-center justify-center py-8" role="status" aria-live="polite">
      <svg viewBox="0 0 240 140" className="h-32 w-56" aria-hidden>
        {endXs.map((endX, i) => {
          const startX = 120;
          const startY = 10;
          const endY = 120;
          const color = ["#059669", "#1E293B", "#FCD34D"][i % 3];
          return (
            <line
              key={i}
              x1={startX}
              y1={startY}
              x2={120 + endX}
              y2={endY}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              style={{
                transition: "x2 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                opacity: 0.85,
              }}
            />
          );
        })}
        <circle cx={120} cy={10} r={4} fill="#1E293B" />
        <circle
          cx={120}
          cy={120}
          r={5}
          fill="#059669"
          style={{
            opacity: phase === "converging" ? 1 : 0,
            transition: "opacity 0.4s ease 0.4s",
          }}
        />
      </svg>
      <p className="mt-2 text-sm text-up-text-secondary">Running the ensemble…</p>
    </div>
  );
}
