"use client";

import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db, firebaseEnabled } from "@/lib/firebase";
import type { SavedValuation } from "@/types/valuation";

// Saves a valuation per CONTEXT.md Section 7's /valuations schema.
// No-ops quietly if Firebase isn't configured — the valuation tool
// itself works without a backend, saving history is purely additive.
export async function saveValuation(
  data: Omit<SavedValuation, "id" | "createdAt">
): Promise<void> {
  if (!firebaseEnabled || !db) return;
  await addDoc(collection(db, "valuations"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function fetchHistory(uid: string): Promise<SavedValuation[]> {
  if (!firebaseEnabled || !db) return [];
  const q = query(
    collection(db, "valuations"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const raw = d.data();
    const createdAt =
      raw.createdAt instanceof Timestamp ? raw.createdAt.toMillis() : Date.now();
    return {
      id: d.id,
      uid: raw.uid,
      inputFeatures: raw.inputFeatures,
      estimate: raw.estimate,
      confidenceRange: raw.confidenceRange,
      modelUsed: raw.modelUsed,
      createdAt,
    } satisfies SavedValuation;
  });
}
