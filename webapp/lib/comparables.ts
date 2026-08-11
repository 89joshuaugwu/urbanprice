"use client";

// Nearest-neighbor "similar properties" lookup against a bundled sample
// of training-data rows.
import type { ComparableProperty } from "@/types/valuation";

let cache: ComparableProperty[] | null = null;

async function loadComparables(): Promise<ComparableProperty[]> {
  if (cache) return cache;
  const res = await fetch("/model/comparable_properties.json");
  cache = (await res.json()) as ComparableProperty[];
  return cache;
}

function normalizedDistance(
  a: ComparableProperty,
  target: { bedrooms: number; bathrooms: number; state: string; propertyType: string }
): number {
  const bedDiff = (a.bedrooms - target.bedrooms) / 9;
  const bathDiff = (a.bathrooms - target.bathrooms) / 9;
  const stateMatch = a.neighborhood === target.state ? 0 : 0.3;
  const typeMatch = a.propertyType === target.propertyType ? 0 : 0.15;
  return Math.sqrt(bedDiff ** 2 + bathDiff ** 2) + stateMatch + typeMatch;
}

export async function findComparables(
  target: { bedrooms: number; bathrooms: number; state: string; propertyType: string },
  count = 4
): Promise<ComparableProperty[]> {
  const all = await loadComparables();
  return [...all]
    .sort((a, b) => normalizedDistance(a, target) - normalizedDistance(b, target))
    .slice(0, count);
}
