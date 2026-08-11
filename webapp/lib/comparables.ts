"use client";

// Nearest-neighbor "similar properties" lookup against a bundled sample
// of training-data rows (per PROMPT.md Phase 3: "keep this simple, it's
// a trust-building UI element, not a core algorithm").
import type { ComparableProperty } from "@/types/valuation";

let cache: ComparableProperty[] | null = null;

async function loadComparables(): Promise<ComparableProperty[]> {
  if (cache) return cache;
  const res = await fetch("/model/comparable_properties.json");
  cache = (await res.json()) as ComparableProperty[];
  return cache;
}

function normalizedDistance(a: ComparableProperty, target: {
  overallQual: number;
  grLivArea: number;
  yearBuilt: number;
}): number {
  const qualDiff = (a.overallQual - target.overallQual) / 10;
  const areaDiff = (a.grLivArea - target.grLivArea) / 3000;
  const yearDiff = (a.yearBuilt - target.yearBuilt) / 140;
  return Math.sqrt(qualDiff ** 2 + areaDiff ** 2 + yearDiff ** 2);
}

export async function findComparables(
  target: { overallQual: number; grLivArea: number; yearBuilt: number },
  count = 4
): Promise<ComparableProperty[]> {
  const all = await loadComparables();
  return [...all]
    .sort((a, b) => normalizedDistance(a, target) - normalizedDistance(b, target))
    .slice(0, count);
}
