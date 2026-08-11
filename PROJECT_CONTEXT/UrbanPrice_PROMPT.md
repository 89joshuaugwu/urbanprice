# UrbanPrice — PROMPT.md

This project has a phase that does NOT go to Antigravity. Phase 0 below is a Google Colab notebook you run yourself in Python. Only Phases 1+ get fed to Antigravity, attaching DESIGN.md + CONTEXT.md as context files each time.

---

## PHASE 0 — Python Training (Google Colab, NOT Antigravity)

```
Do this yourself in a Google Colab notebook, not through Antigravity:

1. Download the Ames Housing dataset (Kaggle: "House Prices - Advanced
   Regression Techniques", or the OpenML equivalent)
2. Follow CONTEXT.md Section 2 exactly — load, clean, feature-engineer,
   train_test_split
3. Train BOTH RandomForestRegressor and GradientBoostingRegressor,
   evaluate both with RMSE/MAE/R2 per Section 2
4. Compute feature_importances_ from the Random Forest, identify your
   top 10-12 features per Section 4 — these become your actual UI form
5. Export both models to JSON exactly per Section 3's export_tree()
   function — produces random_forest.json, gradient_boosting.json,
   model_metadata.json
6. Download all three JSON files, you'll copy them into the Next.js
   project's /public/model/ folder in Phase 1

Do not proceed to Phase 1 until you have:
- Real RMSE/MAE/R2 numbers for both models (you'll need these for the
  Methodology page and your defense)
- A confirmed top-10-12 feature list based on YOUR actual trained
  importances, not an assumed list
- All three JSON files downloaded and ready
```

---

## PHASE 1 — Project Bootstrap (Antigravity)

```
Using DESIGN.md and CONTEXT.md as reference, bootstrap a new Next.js 16
project named "urbanprice" with:

- App Router, TypeScript (strict mode), Tailwind CSS v4, React 19
- Folder structure:
  /app
    /(public)/page.tsx
    /(public)/valuate/page.tsx
    /(public)/methodology/page.tsx
    /(public)/auth/login/page.tsx
    /(public)/auth/signup/page.tsx
    /(public)/history/page.tsx
  /components
    /ui         → Button, Input, Select, Slider, Card, Spinner, Toast
    /molecules  → FeatureInput, EnsembleReveal, EstimateDisplay,
                  MetricCard, ComparablePropertyCard
    /organisms  → ValuationForm, ValuationResult, ModelComparisonPanel
    /shells     → PublicShell
  /lib
    /inference.ts    → predictTree(), predictRandomForest(),
                        predictGradientBoosting() exactly per CONTEXT.md
                        Section 5
    /confidence.ts   → computeConfidenceRange() exactly per CONTEXT.md
                        Section 6
    /firebase.ts     → optional, only if implementing login/history
  /public
    /model
      random_forest.json       <- copy in from Phase 0's output
      gradient_boosting.json   <- copy in from Phase 0's output
      model_metadata.json      <- copy in from Phase 0's output
  /types
    /model.ts, /valuation.ts

Install: lucide-react, react-hot-toast. Firebase only if you're
implementing optional login/history per CONTEXT.md Section 7.

Set up Tailwind CSS v4 theme using the Slate/Value-Green palette from
DESIGN.md Section 1. Load Manrope, Inter, and JetBrains Mono.

CRITICAL: copy your actual Phase 0 JSON exports into /public/model/
before building anything that consumes them — the inference engine and
form both depend on real trained model data, not placeholders.

Working `npm run dev`.
```

---

## PHASE 2 — Inference Engine Integration (verify against Phase 0's Python output)

```
Using CONTEXT.md Sections 5-6, build:

1. /lib/inference.ts — implement exactly per CONTEXT.md Section 5
2. /lib/confidence.ts — implement exactly per CONTEXT.md Section 6
3. A loader for the model JSON files from /public/model/

Requirements:
- Write a small verification check: take 2-3 sample rows FROM YOUR
  ORIGINAL Python test set (X_test), run them through the TypeScript
  predictRandomForest() and predictGradientBoosting() functions, compare
  the TS output against the actual Python .predict() output for the same
  rows — they should match closely (small floating point differences are
  fine, large discrepancies mean the tree export or TS traversal has a bug)
- Do NOT proceed to Phase 3 until this verification passes — if the
  TypeScript inference doesn't match the Python model's real predictions,
  everything built on top of it is wrong

Complete, deployable files. This is the load-bearing correctness check
for the entire project.
```

---

## PHASE 3 — Valuation Form & Result

```
Using DESIGN.md "Valuate" and "Result" sections and CONTEXT.md Section 4, build:

1. /app/(public)/valuate/page.tsx
2. /components/organisms/ValuationForm.tsx
3. /components/organisms/ValuationResult.tsx
4. /components/molecules/FeatureInput.tsx
5. /components/molecules/EnsembleReveal.tsx
6. /components/molecules/EstimateDisplay.tsx
7. /components/molecules/ComparablePropertyCard.tsx

Requirements:
- ValuationForm: ONLY the top 10-12 features identified in Phase 0,
  matched to their actual valid ranges from the dataset (e.g., don't let
  YearBuilt accept 1200 or 3000 — bound it to the dataset's real min/max)
- On submit: fill in non-exposed features with the dataset medians from
  model_metadata.json, run predictRandomForest(), compute confidence
  range, display via EnsembleReveal + EstimateDisplay per DESIGN.md
  Section 1's signature moment — implement the prefers-reduced-motion
  fallback (instant final state)
- Comparable properties: for now, either bundle a small static sample of
  training-data rows to show as "similar properties," or compute nearest
  neighbors by feature distance from a bundled subset — keep this simple,
  it's a trust-building UI element, not a core algorithm
- If Firebase/auth is implemented: save the valuation to /valuations on
  submit if logged in

Complete, deployable files.
```

---

## PHASE 4 — Methodology Page

```
Using DESIGN.md "Methodology" section, build:

1. /app/(public)/methodology/page.tsx
2. /components/organisms/ModelComparisonPanel.tsx
3. /components/molecules/MetricCard.tsx

Requirements:
- Load model_metadata.json, display REAL RMSE/MAE/R2 for both models
  side by side via MetricCards (mono font for the numbers per DESIGN.md)
- Feature importance chart (simple bar chart is fine — Recharts if you
  want to install it, or a plain CSS bar visualization for the top 10-12)
- The explicit dataset disclosure paragraph, EXACT wording per DESIGN.md
  Section 5's methodology page spec — this is your defense honesty
  statement, don't soften or bury it

Complete, deployable files.
```

---

## PHASE 5 — Optional Auth & History

```
Only build this if you decided to implement login/history per CONTEXT.md
Section 7 — this entire project works fine without it.

1. /app/(public)/auth/login/page.tsx
2. /app/(public)/auth/signup/page.tsx
3. /app/(public)/history/page.tsx
4. /lib/firebase.ts, /lib/auth.ts

Requirements:
- Standard Firebase Auth email/password + Google, public self-signup
  (no roles, no admin gating — same reasoning as TaskNest, this is a
  plain consumer utility)
- History: list of the logged-in user's past /valuations, tap to view
  the full result again

Complete, deployable files. Final phase before deploy.
```

---

## Deploy Checklist

```
1. Push to GitHub (89joshuaugwu/urbanprice or similar)
2. Connect to Vercel — if Firebase is used, set env vars from CONTEXT.md
   Section 9; if not, no env vars needed at all
3. If Firebase is used: Firestore Rules -> paste from CONTEXT.md Section
   8 -> Publish, enable Email/Password + Google auth
4. Verify the model JSON files are correctly included in the deployed
   build (they're static assets in /public/model/, should just work,
   but confirm the deployed site's predictions match your local
   Phase 2 verification numbers)
5. Test the full flow: fill the valuation form with values matching a
   KNOWN row from your Python test set, confirm the web app's estimate
   is close to that row's actual predicted value from Python — this is
   your end-to-end correctness proof, keep the numbers from this test
   for your defense
6. Test the confidence range displays sensibly (not absurdly wide or
   suspiciously narrow — sanity check against your actual RMSE)
7. Test prefers-reduced-motion fallback for EnsembleReveal
```

---

Run Phase 0 completely and verify its output before touching Antigravity at all. Phases 1-5 assume real trained model data already exists — there's nothing meaningful to build against placeholder numbers here.
