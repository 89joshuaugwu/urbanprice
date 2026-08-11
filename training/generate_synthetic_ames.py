"""
UrbanPrice — Phase 0 (PLACEHOLDER RUN)
========================================
This script generates a SYNTHETIC dataset that mimics the statistical shape
of the real Ames Housing dataset (Kaggle "House Prices - Advanced
Regression Techniques"), then runs the exact Phase 0 pipeline from
CONTEXT.md Section 2-3 against it.

WHY SYNTHETIC: this build environment has no network access to Kaggle or
OpenML, so the real Ames Housing CSV could not be downloaded here. The
column names, ranges, and rough correlations below are modeled on the
real dataset's well-documented public statistics so the app ships with a
working, structurally-correct model end-to-end.

>>> THIS IS NOT THE REAL DATASET. <<<
Before your defense, replace this by running notebooks/phase0_training.ipynb
(a faithful copy of this script's structure, written for Colab) against the
real ames_housing.csv from Kaggle, then re-export the three JSON files into
/public/model/. See README.md "Replacing the placeholder model" for the
exact steps. Using this synthetic run AS your defense's real numbers would
be a citable misstep — it exists only so the product works out of the box.
"""

import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

rng = np.random.default_rng(42)
N = 1460  # matches real Ames Housing train.csv row count

NEIGHBORHOODS = [
    "NAmes", "CollgCr", "OldTown", "Edwards", "Somerst", "Gilbert",
    "NridgHt", "Sawyer", "NWAmes", "SawyerW", "Mitchel", "BrkSide",
    "Crawfor", "IDOTRR", "Timber", "NoRidge", "StoneBr", "SWISU",
    "ClearCr", "MeadowV", "BrDale", "Veenker", "NPkVill", "Blmngtn", "Blueste",
]
# Rough relative desirability multiplier per neighborhood (synthetic, for
# generating plausible correlated data only)
NEIGH_MULT = {n: rng.uniform(0.78, 1.35) for n in NEIGHBORHOODS}

def gen():
    overall_qual = rng.integers(1, 11, N)
    year_built = rng.integers(1872, 2011, N)
    year_remod = np.clip(year_built + rng.integers(0, 40, N), 1950, 2010)
    gr_liv_area = np.clip(rng.normal(1515, 525, N), 334, 5642).round()
    total_bsmt_sf = np.clip(rng.normal(1057, 438, N), 0, 6110).round()
    first_flr_sf = np.clip(gr_liv_area * rng.uniform(0.45, 0.9, N), 334, 4692).round()
    garage_cars = np.clip(rng.normal(1.77, 0.75, N), 0, 4).round()
    garage_area = np.clip(garage_cars * rng.normal(280, 40, N), 0, 1418).round()
    full_bath = np.clip(rng.normal(1.57, 0.55, N), 0, 3).round()
    tot_rms = np.clip(rng.normal(6.5, 1.6, N), 2, 14).round()
    lot_area = np.clip(rng.lognormal(9.1, 0.5, N), 1300, 215245).round()
    neighborhood = rng.choice(NEIGHBORHOODS, N)
    neigh_mult = np.array([NEIGH_MULT[n] for n in neighborhood])
    fireplaces = np.clip(rng.poisson(0.6, N), 0, 3)

    base = (
        18000
        + overall_qual * 15500
        + gr_liv_area * 46
        + total_bsmt_sf * 22
        + first_flr_sf * 9
        + garage_cars * 9800
        + full_bath * 6200
        + tot_rms * 2100
        + (year_built - 1872) * 210
        + fireplaces * 3100
        + np.log1p(lot_area) * 1800
    )
    price = base * neigh_mult * rng.normal(1.0, 0.09, N)
    price = np.clip(price, 34900, 755000).round()

    df = pd.DataFrame({
        "OverallQual": overall_qual,
        "GrLivArea": gr_liv_area,
        "GarageCars": garage_cars,
        "TotalBsmtSF": total_bsmt_sf,
        "YearBuilt": year_built,
        "YearRemodAdd": year_remod,
        "FullBath": full_bath,
        "Neighborhood": neighborhood,
        "LotArea": lot_area,
        "1stFlrSF": first_flr_sf,
        "TotRmsAbvGrd": tot_rms,
        "GarageArea": garage_area,
        "Fireplaces": fireplaces,
        "SalePrice": price,
    })
    return df

df = gen()
df.to_csv("ames_housing_synthetic.csv", index=False)

# ---- CONTEXT.md Section 2: feature engineering ----
# One-hot encode Neighborhood only (the one categorical we expose in the UI)
neigh_dummies = pd.get_dummies(df["Neighborhood"], prefix="Neighborhood")
feature_cols_numeric = [
    "OverallQual", "GrLivArea", "GarageCars", "TotalBsmtSF", "YearBuilt",
    "YearRemodAdd", "FullBath", "LotArea", "1stFlrSF", "TotRmsAbvGrd",
    "GarageArea", "Fireplaces",
]
X = pd.concat([df[feature_cols_numeric], neigh_dummies], axis=1).astype(float)
y = df["SalePrice"].astype(float)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
rf.fit(X_train, y_train)

gb = GradientBoostingRegressor(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
gb.fit(X_train, y_train)

metrics = {}
for name, key, model in [("Random Forest", "randomForest", rf), ("Gradient Boosting", "gradientBoosting", gb)]:
    preds = model.predict(X_test)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    mae = float(mean_absolute_error(y_test, preds))
    r2 = float(r2_score(y_test, preds))
    metrics[key] = {"rmse": rmse, "mae": mae, "r2": r2}
    print(f"{name}: RMSE={rmse:.0f}, MAE={mae:.0f}, R2={r2:.3f}")

importances = pd.Series(rf.feature_importances_, index=X.columns).sort_values(ascending=False)
print("\nTop feature importances:")
print(importances.head(15))

# ---- CONTEXT.md Section 4: feature selection for the UI ----
# Top-12 by importance, collapsing the one-hot Neighborhood_* columns back
# into a single "Neighborhood" entry so the UI form gets one dropdown, not
# 25 checkboxes.
imp_collapsed = {}
for feat, val in importances.items():
    key = "Neighborhood" if feat.startswith("Neighborhood_") else feat
    imp_collapsed[key] = imp_collapsed.get(key, 0) + val
imp_collapsed = pd.Series(imp_collapsed).sort_values(ascending=False)
top_features = list(imp_collapsed.head(12).index)
print("\nTop UI features (collapsed):", top_features)

# ---- CONTEXT.md Section 3: export trees to JSON ----
def export_tree(tree_estimator):
    tree = tree_estimator.tree_
    nodes = []
    for i in range(tree.node_count):
        is_leaf = tree.children_left[i] == tree.children_right[i]
        nodes.append({
            "featureIndex": -1 if is_leaf else int(tree.feature[i]),
            "threshold": float(tree.threshold[i]),
            "left": int(tree.children_left[i]),
            "right": int(tree.children_right[i]),
            "value": float(tree.value[i][0][0]),
        })
    return nodes

rf_trees = [export_tree(estimator) for estimator in rf.estimators_]
gb_trees = [export_tree(estimator[0]) for estimator in gb.estimators_]
gb_learning_rate = gb.learning_rate
gb_init_value = float(gb.init_.constant_[0][0])

feature_names = list(X.columns)

with open("random_forest.json", "w") as f:
    json.dump({"trees": rf_trees, "featureNames": feature_names}, f)

with open("gradient_boosting.json", "w") as f:
    json.dump({
        "trees": gb_trees,
        "learningRate": gb_learning_rate,
        "initValue": gb_init_value,
        "featureNames": feature_names,
    }, f)

# Dataset medians/modes for every feature (used to backfill non-exposed
# features per CONTEXT.md Section 4), plus real min/max for UI bounds on
# exposed numeric features.
medians = {c: float(X[c].median()) for c in feature_names}
ui_ranges = {
    c: {"min": float(df[c].min()), "max": float(df[c].max())}
    for c in feature_cols_numeric
}
neighborhood_list = sorted(df["Neighborhood"].unique().tolist())

with open("model_metadata.json", "w") as f:
    json.dump({
        "trainedAt": "2026-08-10",
        "datasetSource": "SYNTHETIC placeholder modeled on Ames Housing (Kaggle) — see training/generate_synthetic_ames.py docstring. Replace before using real figures in a defense.",
        "sampleCount": int(N),
        "trainTestSplit": {"train": int(len(X_train)), "test": int(len(X_test))},
        "metrics": metrics,
        "featureImportances": {k: float(v) for k, v in imp_collapsed.head(15).items()},
        "topUiFeatures": top_features,
        "featureMedians": medians,
        "uiRanges": ui_ranges,
        "neighborhoods": neighborhood_list,
        "featureNames": feature_names,
    }, f, indent=2)

print("\nWrote random_forest.json, gradient_boosting.json, model_metadata.json")

# ---- Phase 2 verification fixtures: a few real test rows + Python's own
# predictions, so the Next.js app can verify its TS inference engine
# matches this Python model exactly (see /lib/inference.verify.ts) ----
sample_idx = X_test.index[:5]
verification = []
for idx in sample_idx:
    row = X.loc[idx]
    verification.append({
        "features": {c: float(row[c]) for c in feature_names},
        "rfPrediction": float(rf.predict(row.values.reshape(1, -1))[0]),
        "gbPrediction": float(gb.predict(row.values.reshape(1, -1))[0]),
        "actualSalePrice": float(y.loc[idx]),
    })

with open("verification_samples.json", "w") as f:
    json.dump(verification, f, indent=2)

print("Wrote verification_samples.json (Phase 2 correctness check fixtures)")
