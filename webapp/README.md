# UrbanPrice — Web App

An Automated Valuation Model (AVM) for Nigerian housing units. Two
ensembled regression-tree models (Random Forest + Gradient Boosting) are
trained offline in Python on real Nigerian property listing data and
shipped as static exported trees; a TypeScript inference engine runs
entirely in the browser to produce estimates in Naira — **no ML server,
no API calls at prediction time.**

Built with Next.js 16 (App Router), React 19, TypeScript (strict), and
Tailwind CSS v4. Live at https://urbanprice.vercel.app.

---

## 1. Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. That's it — the app works fully out of the
box with **zero environment variables and zero backend**, using the
trained model JSON already bundled in `public/model/`.

## 2. About the bundled model — dataset disclosure

The model is trained on **24,195 real Nigerian property listings**
across 25 states — bedrooms, bathrooms, toilets, parking spaces,
property type, and asking price — sourced from a public GitHub mirror of
the Kaggle "Nigeria Houses and Prices Dataset" (Abdullahi Yunus):
https://github.com/temiobasa/Exploratory-Data-Analysis-for-Residential-Real-Estate-Prices-in-Nigeria

**Two things to be upfront about if asked in a defense:**

1. **Listing prices, not verified sales.** This is scraped asking-price
   data from property portals, not confirmed completed-transaction
   records. Asking prices commonly run higher than actual sale prices.
   Say this plainly if asked — don't imply these are closed-sale prices.
2. **Limited feature set.** The source data has no square footage, exact
   GPS location, or condition rating — only bedroom/bathroom/toilet/
   parking counts, state, and property type. That's reflected honestly
   in the R² (~0.28 for Random Forest, on the test split) rather than
   hidden. A log-price target transform was tested and improved the
   log-space R² to ~0.52, but made *raw-Naira* accuracy worse (the
   product's actual job) — see `training/README.md` for that comparison
   and why the untransformed target was kept.

Both points are already disclosed on the live `/methodology` page.

## 3. Project structure

```
webapp/
  app/
    layout.tsx                     Root layout: fonts, favicon, metadata
    (public)/
      layout.tsx                   Wraps all pages in PublicShell (header/footer)
      page.tsx                     Landing page  ("/")
      valuate/page.tsx             The core tool ("/valuate")
      methodology/page.tsx         Model metrics + dataset disclosure ("/methodology")
      auth/login/page.tsx          Optional login ("/auth/login")
      auth/signup/page.tsx         Optional signup ("/auth/signup")
      history/page.tsx             Optional saved-valuation history ("/history")
  components/
    ui/            Button, Input, Select, Slider, Card, Spinner, Toast
    molecules/      FeatureInput, EnsembleReveal, EstimateDisplay, MetricCard, ComparablePropertyCard
    organisms/      ValuationForm, ValuationResult, ModelComparisonPanel
    shells/         PublicShell (nav + footer)
  lib/
    inference.ts     predictTree / predictRandomForest / predictGradientBoosting
    confidence.ts     computeConfidenceRange (Random Forest ensemble spread)
    features.ts       buildFeatureVector + UI labels/help text
    model.ts           fetches + caches the 3 model JSON files client-side
    comparables.ts    nearest-neighbor lookup against a bundled sample
    firebase.ts, auth.ts, valuations.ts    optional Firebase layer
    format.ts          Naira currency / number formatting
  types/            model.ts, valuation.ts
  public/
    model/           random_forest.json, gradient_boosting.json,
                      model_metadata.json, verification_samples.json,
                      comparable_properties.json  ← static model artifacts
    icons/, logo.png, favicon.ico, apple-touch-icon.png, manifest.webmanifest
  firebase/
    firestore.rules  Security rules for the optional /valuations collection
  scripts/
    verify-inference.mjs   Correctness check (see below)
  .env.example
```

## 4. The seven inputs the model uses

`Bedrooms`, `Bathrooms`, `Toilets`, `ParkingSpace` (all numeric sliders),
`State` (25 Nigerian states, dropdown), `Town` (cascading — scoped to
whichever State is currently selected; e.g. 47 towns under Lagos, 53
under Abuja), `PropertyType` (Detached Duplex, Terraced Duplexes, Semi
Detached Duplex, Detached Bungalow, Block of Flats, Semi Detached
Bungalow, Terraced Bungalow — dropdown). Town is by far the single most
important feature in the model (raised R² from 0.24 to 0.67 when added)
— it's the difference between, say, Lekki and Ikoyi, two areas within
the same Lagos state whose real prices differ by 5x+.

## 5. Verifying the inference engine is correct

This is the load-bearing correctness check for the whole project: the
TypeScript tree-traversal logic in `lib/inference.ts` must reproduce the
Python model's real `.predict()` output for the same rows.

```bash
npm run verify
```

This runs `scripts/verify-inference.mjs` against
`public/model/verification_samples.json` (five real rows from the Python
test set, with Python's own predictions attached). It should print
`PASSED` with near-zero diffs. If you retrain the model, this script
re-verifies against the new export automatically — just make sure
`verification_samples.json` is regenerated alongside the other three
files.

## 6. Optional: login + saved history (Firebase)

Already configured on the live deployment. To set up on a fresh clone:

1. Create a free Firebase project at https://console.firebase.google.com
   (Spark/free plan is enough).
2. Enable **Authentication → Sign-in method → Email/Password** and
   **Google**.
3. Enable **Firestore Database** (production mode).
4. Copy `.env.example` to `.env.local` and fill in the six
   `NEXT_PUBLIC_FIREBASE_*` values from your Firebase project settings.
5. In the Firebase Console, go to **Firestore → Rules**, paste the
   contents of `firebase/firestore.rules`, and click **Publish**. Repeat
   this manual step any time you change the rules file — Firebase
   doesn't auto-deploy rules from a repo without the Firebase CLI/CI set
   up separately.
6. Restart `npm run dev`. Login/Signup/History now work.

### Firestore data model

```
/valuations/{valuationId}
  uid: string | null
  inputFeatures: { Bedrooms, Bathrooms, Toilets, ParkingSpace, State, PropertyType }
  estimate: number
  confidenceRange: { low: number, high: number }
  modelUsed: "randomForest" | "gradientBoosting"
  createdAt: server timestamp
```

## 7. Deploying

Already live at https://urbanprice.vercel.app (Vercel, root directory
set to `webapp/`, `NEXT_PUBLIC_FIREBASE_*` env vars set). To redeploy
after local changes: `git push` to the connected branch — Vercel
auto-builds. To update Firestore rules on a change, repeat step 5 above
manually in the Firebase Console; pushing to GitHub does not touch them.

## 8. Retraining / updating the model

```bash
cd ../training
python3 generate_nigeria_model.py
cp random_forest.json gradient_boosting.json model_metadata.json \
   verification_samples.json comparable_properties.json \
   ../webapp/public/model/
cd ../webapp
npm run verify   # must print PASSED before trusting anything downstream
```

See `../training/README.md` for what the script does and how to point it
at a different/updated dataset.

See `../SAMPLE_CASES.md` for example inputs/outputs to sanity-check
against, and `../PROJECT_CONTEXT/` for the original design specs this
app was built from (note: those docs predate the switch to real Nigerian
data and reference the old Ames Housing/US framing — the dataset section
is superseded by this README, the UI/methodology principles still hold).
