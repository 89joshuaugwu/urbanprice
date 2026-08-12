# UrbanPrice — Training (Phase 0)

This folder is the **Python phase** — it does not run inside the Next.js
app, and never runs in production. It's a one-time (or occasional, if
retraining) offline step whose only output is JSON files consumed by the
web app as static assets.

## Current model: real Nigerian property data

`generate_nigeria_model.py` trains on **24,195 real Nigerian property
listings** across 25 states (bedrooms, bathrooms, toilets, parking
spaces, property type, state, price in Naira), downloaded from:

https://github.com/temiobasa/Exploratory-Data-Analysis-for-Residential-Real-Estate-Prices-in-Nigeria

— a public GitHub mirror of the Kaggle "Nigeria Houses and Prices
Dataset" by Abdullahi Yunus. `nigeria_houses_raw.csv` is the untouched
download; `nigeria_houses_cleaned.csv` is after dropping ~131 rows with
clearly erroneous prices (below ₦2M or above the 99.5th percentile).

**Disclosure to carry into any defense:** this is scraped listing
(asking) price data, not verified completed sales — say so plainly if
asked. It's still real Nigerian market data, meaningfully more
defensible for a Nigeria-titled project than a US benchmark dataset.

### Why raw price, not log(price), as the training target

Naira prices are heavily right-skewed. Training on `log1p(price)` instead
of raw price is standard practice for skewed monetary targets, and was
tested here — it improved *log-space* R² from ~0.28 to ~0.52. But once
predictions are transformed back to raw Naira (`expm1`), raw-scale R²
got *worse* (~0.17 vs ~0.28), because a handful of extreme high-value
listings dominate squared error once exponentiated back. Since the
product's actual job is giving users accurate raw-Naira estimates — not
log-price estimates — the untransformed target was kept. This trade-off
is worth mentioning in a methodology writeup: it's a real modeling
decision with a documented reason, not an arbitrary default.

### Why Random Forest has a monotonic constraint

On a ~24k-row dataset with only 6 source features, some feature
combinations are thin (e.g. a 4-bedroom home with only 1 bathroom).
Without constraints, Random Forest can extrapolate in counter-intuitive
directions for those rare combinations — e.g. an earlier unconstrained
version of this model priced a 2-bedroom Lagos duplex *lower* than an
otherwise-identical 1-bedroom one, purely because that exact combination
was sparse in training data. Technically consistent with the data, but
it reads as broken in a live product where users expect "more rooms
never means cheaper."

`RandomForestRegressor(monotonic_cst=[...])` (scikit-learn ≥1.4) fixes
this: it constrains Bedrooms/Bathrooms/Toilets/ParkingSpace to be
non-decreasing with predicted price, with no constraint on the State/
PropertyType one-hot columns (there's no meaningful ordering to enforce
there). Cost: raw-scale R² drops slightly (0.276 → 0.237) — an honest,
documented trade-off in exchange for predictions that always move the
direction a user expects. Gradient Boosting does NOT have this
constraint (`GradientBoostingRegressor` doesn't support `monotonic_cst`
in this scikit-learn version — only `HistGradientBoostingRegressor`
does, which is architecturally different and wasn't used here), which is
part of why Random Forest is the model actually shown to users on
`/valuate` — Gradient Boosting is only used for the side-by-side
comparison on `/methodology`.

### Why 50/80 trees at shallower depth, not 100 at depth 10

This dataset has only 6 source features (4 numeric + 2 categorical) —
much less signal than a richer dataset would offer, so deeper/more trees
mainly overfit rather than help. A smaller model (`random_forest.json`
is ~1.3MB vs. ~4.6MB at full depth) also matters for a mobile-first
product on Nigerian mobile data connections.

## Files

- `generate_nigeria_model.py` — the script that produced the model
  currently bundled in `webapp/public/model/`.
- `nigeria_houses_raw.csv` / `nigeria_houses_cleaned.csv` — the source
  data, before/after cleaning.
- `random_forest.json`, `gradient_boosting.json`, `model_metadata.json`,
  `verification_samples.json`, `comparable_properties.json` — the
  outputs, already copied into `webapp/public/model/`.
- `generate_synthetic_ames.py`, `generate_comparables.py`,
  `ames_housing_synthetic.csv` — an earlier, now-superseded synthetic
  Ames-Housing-style pipeline, kept for reference only. **Not used by
  the shipped app.**

## Why scikit-learn tree export, not a saved .pkl model

Shipping a `.pkl`/`.joblib` file would mean the web app needs a Python
backend to load and serve it — extra infrastructure, extra cost, extra
latency. Instead, `export_tree()` flattens each trained
`DecisionTreeRegressor` into a plain array of `{featureIndex, threshold,
left, right, value}` nodes — a format any language can traverse. The
TypeScript engine in `webapp/lib/inference.ts` re-implements that
traversal exactly, which is why `npm run verify` (in webapp/) matters:
it's the proof that the JS traversal and the original Python model agree.

## Re-running / retraining

```bash
pip install pandas numpy scikit-learn --break-system-packages   # if needed
python3 generate_nigeria_model.py
cp random_forest.json gradient_boosting.json model_metadata.json \
   verification_samples.json comparable_properties.json \
   ../webapp/public/model/
cd ../webapp && npm run verify
```

To retrain on an updated/larger dataset later: replace
`nigeria_houses_raw.csv` with a new CSV in the same column shape
(bedrooms, bathrooms, toilets, parking_space, title, town, state, price)
and re-run.
