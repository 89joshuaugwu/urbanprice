"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthChange } from "@/lib/auth";
import { fetchHistory } from "@/lib/valuations";
import { firebaseEnabled } from "@/lib/firebase";
import { formatCurrency } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import type { SavedValuation } from "@/types/valuation";
import type { User } from "firebase/auth";

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<SavedValuation[]>([]);

  useEffect(() => onAuthChange(setUser), []);

  useEffect(() => {
    if (!user) return;
    fetchHistory(user.uid)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [user]);

  if (!firebaseEnabled) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-up-primary">History unavailable</h1>
        <p className="mt-3 text-up-text-secondary">
          This deployment doesn&apos;t have Firebase configured, so saved history
          isn&apos;t enabled.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-up-primary">Log in to view history</h1>
        <Link href="/auth/login" className="mt-4 inline-block underline hover:text-up-primary">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-up-primary">Your history</h1>
      <div className="mt-6">
        {loading && <Spinner label="Loading your past valuations…" />}
        {!loading && history.length === 0 && (
          <p className="text-up-text-secondary">You haven&apos;t saved any estimates yet.</p>
        )}
        <ul className="space-y-3">
          {history.map((h) => (
            <li
              key={h.id}
              className="rounded-xl border border-up-border bg-white p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-up-text-secondary">
                  {new Date(h.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-up-text-primary">
                  {h.inputFeatures["State"]} · {h.inputFeatures["Bedrooms"]} bed
                </p>
              </div>
              <p className="font-data font-semibold text-up-accent">
                {formatCurrency(h.estimate)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
