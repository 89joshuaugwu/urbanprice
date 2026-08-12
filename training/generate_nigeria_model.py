"""
UrbanPrice — Phase 0 (NIGERIA, real data)
===========================================
Trains on a REAL scraped Nigerian property listings dataset (24,326 rows:
bedrooms, bathrooms, toilets, parking spaces, property type, town, state,
and price in Naira), sourced via a public GitHub mirror of a Kaggle
dataset ("Nigeria Houses and Prices Dataset" by Abdullahi Yunus, scraped
from Lagos-area listings but covering 25 Nigerian states):
  https://github.com/temiobasa/Exploratory-Data-Analysis-for-Residential-Real-Estate-Prices-in-Nigeria

This REPLACES the earlier synthetic Ames-Housing-shaped placeholder.
This is real transaction-listing data for a Nigeria-specific project.

Known limitation to disclose in your defense: this is LISTING/asking-price
data scraped from property portals, not verified completed-sale records —
be upfront about that distinction if asked. It is still meaningfully more
defensible than a US benchmark dataset for a Nigeria-titled project.
"""

import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

df = pd.read_csv("nigeria_houses_raw.csv")

# ---- Clean ----
# Drop obvious scraping errors: prices below ₦2M (unrealistic for a house)
# or above the 99.5th percentile (a handful of multi-trillion-naira rows
# that are clearly data-entry errors, not real luxury listings).
low, high = 2_000_000, df["price"].quantile(0.995)
df = df[(df["price"] >= low) & (df["price"] <= high)].copy()
df = df.rename(columns={
    "bedrooms": "Bedrooms",
    "bathrooms": "Bathrooms",
    "toilets": "Toilets",
    "parking_space": "ParkingSpace",
    "title": "PropertyType",
    "state": "State",
    "price": "SalePrice",
})
df = df.reset_index(drop=True)
print(f"Cleaned dataset: {len(df)} rows (dropped {24326 - len(df)} outlier/error rows)")

# Keep every town/city — no bucketing. The UI groups them by State so a
# 189-option flat dropdown never appears; users pick State first, then a
# short state-specific Town list. 31 town names appear under more than
# one State in the raw data (e.g. "Ikeja" listed under both Lagos and
# another state) — that's kept as-is; it reflects the real (State, Town)
# pairs present in the source data rather than being collapsed away.
df = df.rename(columns={"town": "Town"})
df["Town"] = df["Town"].str.strip()
df = df.reset_index(drop=True)
print(f"Cleaned dataset: {len(df)} rows (dropped {24326 - len(df)} outlier/error rows)")
print(f"Towns kept: {df['Town'].nunique()} across {df['State'].nunique()} states")

df.to_csv("nigeria_houses_cleaned.csv", index=False)

# ---- Feature engineering ----
# Two categoricals get one-hot encoded: State (25 values, this dataset's
# equivalent of Ames Housing's "Neighborhood") and PropertyType (7 values).
numeric_cols = ["Bedrooms", "Bathrooms", "Toilets", "ParkingSpace"]
state_dummies = pd.get_dummies(df["State"], prefix="State")
type_dummies = pd.get_dummies(df["PropertyType"], prefix="PropertyType")
town_dummies = pd.get_dummies(df["Town"], prefix="Town")
X = pd.concat([df[numeric_cols], state_dummies, type_dummies, town_dummies], axis=1).astype(float)
y = df["SalePrice"].astype(float)
# NOTE: a log1p(price) target transform was tested (standard practice for
# skewed monetary targets) — it improved log-space R² (~0.52) but made
# RAW-naira-scale R² worse (~0.17 vs ~0.28 here), because a few extreme
# high-value listings dominate squared error once exponentiated back.
# Since the product's whole job is accurate raw-Naira estimates, not
# log-price estimates, the untransformed target is the better choice
# here — see training/README.md for the full comparison.

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Kept deliberately small (50 trees / depth 8) vs. the original 100/depth-10
# spec: this dataset only has 4 numeric + 2 categorical source features
# (much less signal than Ames' dozens of columns), so deeper/more trees
# mainly overfit rather than help — and a smaller model JSON matters for
# a mobile-first product on Nigerian mobile data connections.
rf = RandomForestRegressor(
    n_estimators=50,
    max_depth=8,
    min_samples_leaf=5,
    random_state=42,
    # Monotonic constraint: predicted price must never decrease as
    # Bedrooms/Bathrooms/Toilets/ParkingSpace increase, no matter how
    # sparse a particular combination is in the training data. Without
    # this, rare combinations (e.g. many bedrooms but few bathrooms)
    # can make the model extrapolate in counter-intuitive directions —
    # technically "correct" given the data, but confusing in a live
    # product where users expect "more rooms => never cheaper." State
    # and PropertyType one-hot columns get no constraint (0) — there's
    # no meaningful ordering to constrain there.
    monotonic_cst=[1 if c in numeric_cols else 0 for c in X.columns],
)
rf.fit(X_train, y_train)

gb = GradientBoostingRegressor(n_estimators=80, max_depth=3, learning_rate=0.08, random_state=42)
gb.fit(X_train, y_train)

metrics = {}
for name, key, model in [("Random Forest", "randomForest", rf), ("Gradient Boosting", "gradientBoosting", gb)]:
    preds = model.predict(X_test)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    mae = float(mean_absolute_error(y_test, preds))
    r2 = float(r2_score(y_test, preds))
    metrics[key] = {"rmse": rmse, "mae": mae, "r2": r2}
    print(f"{name}: RMSE=₦{rmse:,.0f}, MAE=₦{mae:,.0f}, R2={r2:.3f}")

importances = pd.Series(rf.feature_importances_, index=X.columns).sort_values(ascending=False)
print("\nTop feature importances:")
print(importances.head(15))

# Collapse one-hot columns back to their source feature for the UI list.
imp_collapsed = {}
for feat, val in importances.items():
    if feat.startswith("State_"):
        key = "State"
    elif feat.startswith("PropertyType_"):
        key = "PropertyType"
    elif feat.startswith("Town_"):
        key = "Town"
    else:
        key = feat
    imp_collapsed[key] = imp_collapsed.get(key, 0) + val
imp_collapsed = pd.Series(imp_collapsed).sort_values(ascending=False)
top_features = list(imp_collapsed.index)  # all 7 source features are exposed on the form — there's nothing left to hide behind medians
print("\nTop UI features (collapsed):", top_features)

# ---- Export trees to JSON (same schema as before) ----
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
feature_names = list(X.columns)

with open("random_forest.json", "w") as f:
    json.dump({"trees": rf_trees, "featureNames": feature_names}, f)

with open("gradient_boosting.json", "w") as f:
    json.dump({
        "trees": gb_trees,
        "learningRate": gb.learning_rate,
        "initValue": float(gb.init_.constant_[0][0]),
        "featureNames": feature_names,
    }, f)

medians = {c: float(X[c].median()) for c in feature_names}
ui_ranges = {c: {"min": float(df[c].min()), "max": float(df[c].max())} for c in numeric_cols}
states_list = sorted(df["State"].unique().tolist())
property_types_list = sorted(df["PropertyType"].unique().tolist())
towns_list = sorted(df["Town"].unique().tolist())  # all towns, flat (fallback use only)
towns_by_state = (
    df.groupby("State")["Town"]
    .apply(lambda s: sorted(s.unique().tolist()))
    .to_dict()
)

with open("model_metadata.json", "w") as f:
    json.dump({
        "trainedAt": "2026-08-11",
        "datasetSource": "REAL: Nigeria Houses and Prices Dataset (scraped property listings, 25 states, 30 named towns/cities + Other) — github.com/temiobasa/Exploratory-Data-Analysis-for-Residential-Real-Estate-Prices-in-Nigeria, originally from Kaggle (Abdullahi Yunus). NOTE: these are listing/asking prices, not verified completed sales — disclose this distinction if asked.",
        "sampleCount": int(len(df)),
        "trainTestSplit": {"train": int(len(X_train)), "test": int(len(X_test))},
        "metrics": metrics,
        "featureImportances": {k: float(v) for k, v in imp_collapsed.items()},
        "topUiFeatures": top_features,
        "featureMedians": medians,
        "uiRanges": ui_ranges,
        "neighborhoods": states_list,        # kept as "neighborhoods" for schema compatibility with the web app; represents Nigerian States here
        "propertyTypes": property_types_list,
        "towns": towns_list,
        "townsByState": towns_by_state,
        "currency": "NGN",
        "targetTransform": "identity",
        "featureNames": feature_names,
        "categoricalFeatures": {"State": "State", "PropertyType": "PropertyType", "Town": "Town"},
    }, f, indent=2)

print("\nWrote random_forest.json, gradient_boosting.json, model_metadata.json")

# ---- Verification fixtures ----
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
print("Wrote verification_samples.json")

# ---- Comparable properties sample ----
sample = df.sample(60, random_state=7)
comp_rows = []
for i, r in sample.iterrows():
    comp_rows.append({
        "id": f"comp-{i}",
        "neighborhood": r["State"],
        "town": r["Town"],
        "propertyType": r["PropertyType"],
        "bedrooms": int(r["Bedrooms"]),
        "bathrooms": int(r["Bathrooms"]),
        "salePrice": int(r["SalePrice"]),
    })
with open("comparable_properties.json", "w") as f:
    json.dump(comp_rows, f, indent=2)
print("Wrote comparable_properties.json")
