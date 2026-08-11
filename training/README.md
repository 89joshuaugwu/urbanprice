# UrbanPrice — Training (Phase 0)

This folder is the **Python phase** — it does not run inside the Next.js
app, and never runs in production. It's a one-time (or occasional, if
retraining) offline step whose only output is three JSON files consumed
by the web app as static assets.

## Files

- `generate_synthetic_ames.py` — the script that produced the model
  currently bundled in `webapp/public/model/`. Generates a synthetic
  dataset shaped after Ames Housing (see the big docstring at the top of
  the file for why — short version: this build environment couldn't
  reach Kaggle/OpenML), then runs the real training/export pipeline
  against it.
- `ames_housing_synthetic.csv` — the generated dataset itself.
- `random_forest.json`, `gradient_boosting.json`, `model_metadata.json`,
  `verification_samples.json`, `comparable_properties.json` — the
  outputs, already copied into `webapp/public/model/`.

## Replacing this with the real Ames Housing dataset

See `webapp/README.md` Section 7 for full steps. Short version: swap the
`gen()` synthetic-data call for `pd.read_csv("train.csv")` (the real
Kaggle file), keep everything from feature engineering onward as-is, run
it in Colab, and copy the four JSON outputs into `webapp/public/model/`.

## Why scikit-learn tree export, not a saved .pkl model

Shipping a `.pkl`/`.joblib` file would mean the web app needs a Python
backend to load and serve it — extra infrastructure, extra cost, extra
latency. Instead, `export_tree()` flattens each trained
`DecisionTreeRegressor` into a plain array of `{featureIndex, threshold,
left, right, value}` nodes — a format any language can traverse. The
TypeScript engine in `webapp/lib/inference.ts` re-implements that
traversal exactly, which is why `npm run verify` (in webapp/) matters:
it's the proof that the JS traversal and the original Python model agree.

## Re-running

```bash
pip install pandas numpy scikit-learn --break-system-packages   # if needed
python3 generate_synthetic_ames.py
cp random_forest.json gradient_boosting.json model_metadata.json \
   verification_samples.json comparable_properties.json \
   ../webapp/public/model/
```
