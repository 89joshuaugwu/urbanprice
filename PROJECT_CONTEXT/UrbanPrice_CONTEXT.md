# UrbanPrice — CONTEXT.md

Technical architecture reference. Pair with `DESIGN.md` when prompting Antigravity. This project has a Python phase that happens OUTSIDE Antigravity — read Section 1 before starting anything.

---

## 1. Two-Phase Architecture

| Phase | Where it happens | Output |
|---|---|---|
| A. Training | Google Colab (Python) — NOT Antigravity, NOT part of the Next.js codebase | Trained model exported as JSON tree files |
| B. Product | Antigravity, Next.js/TypeScript | The actual web app, consuming Phase A's exported JSON as a static asset |

Phase A happens once (or occasionally, if you retrain), Phase B is your ongoing development work. PROMPT.md's Phase 0 is a Python notebook, not a Next.js scaffold — don't feed it to Antigravity.

**Dataset:** Ames Housing (Kaggle's "House Prices — Advanced Regression Techniques" dataset), NOT Boston Housing. Boston Housing was removed from scikit-learn itself in version 1.2 due to a documented ethical problem — one of its original features was constructed from racial demographic assumptions. Ames Housing is the modern, standard replacement used throughout current ML education and research. Using Boston Housing today is a real, citable misstep worth avoiding entirely, not just a style preference.

**Explicit scope statement for your defense:** this model is trained and evaluated against Ames Housing (Story County, Iowa, USA) as a methodology benchmark — validating that the ensemble regression approach works correctly and can be properly evaluated. It is NOT trained on Enugu or Nigerian housing data, because no comparable public transaction dataset exists for that market. State this plainly in your write-up (DESIGN.md's Methodology page is built specifically to surface this honestly, not bury it).

---

## 2. Phase A — Python Training (Google Colab)

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import json

# Load Ames Housing (available via Kaggle or OpenML)
df = pd.read_csv("ames_housing.csv")

# Feature engineering: handle missing values, encode categoricals
# (drop or impute NAs, one-hot encode a small set of categorical
# features you plan to expose in the UI — keep this bounded, don't
# one-hot encode all 79 original features, only the ones you're
# actually exposing per Section 4)

X = df[selected_features]  # see Section 4 for feature selection
y = df["SalePrice"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
rf.fit(X_train, y_train)

gb = GradientBoostingRegressor(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
gb.fit(X_train, y_train)

# Evaluate both -- this comparison IS the methodology contribution
for name, model in [("Random Forest", rf), ("Gradient Boosting", gb)]:
    preds = model.predict(X_test)
    rmse = mean_squared_error(y_test, preds, squared=False)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"{name}: RMSE={rmse:.0f}, MAE={mae:.0f}, R2={r2:.3f}")

# Feature importance -- use this to decide which features make the
# reduced UI form (per Section 4), not an arbitrary guess
importances = pd.Series(rf.feature_importances_, index=X.columns).sort_values(ascending=False)
print(importances.head(15))
```

---

## 3. Exporting Trees to JSON

```python
def export_tree(tree_estimator):
    """Flattens a single sklearn DecisionTreeRegressor into a JSON-serializable
    array of nodes, matching the TypeScript TreeNode interface in Section 5."""
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

# Random Forest: export every individual tree, TS averages them
rf_trees = [export_tree(estimator) for estimator in rf.estimators_]

# Gradient Boosting: export every tree + the learning rate + initial base value
gb_trees = [export_tree(estimator[0]) for estimator in gb.estimators_]
gb_learning_rate = gb.learning_rate
gb_init_value = float(gb.init_.constant_[0][0])

with open("random_forest.json", "w") as f:
    json.dump({"trees": rf_trees, "featureNames": list(X.columns)}, f)

with open("gradient_boosting.json", "w") as f:
    json.dump({
        "trees": gb_trees,
        "learningRate": gb_learning_rate,
        "initValue": gb_init_value,
        "featureNames": list(X.columns),
    }, f)

with open("model_metadata.json", "w") as f:
    json.dump({
        "trainedAt": "2026-08-10",
        "datasetSource": "Ames Housing (Kaggle)",
        "metrics": {
            "randomForest": {"rmse": rf_rmse, "mae": rf_mae, "r2": rf_r2},
            "gradientBoosting": {"rmse": gb_rmse, "mae": gb_mae, "r2": gb_r2},
        },
        "featureImportances": importances.head(15).to_dict(),
    }, f)
```

Copy these three JSON files into `/public/model/` in the Next.js project — they're static assets shipped with the app, not fetched from a database.

---

## 4. Feature Selection for the UI (reduce ~79 columns to ~10-12)

Ames Housing has around 79 raw features — far too many for a usable mobile form. Use the trained model's `feature_importances_` (Section 2's output) to select the top 10-12 highest-impact features for the actual UI form. Typical top predictors in this dataset (confirm against YOUR actual trained importances, don't assume this list without checking): OverallQual, GrLivArea, GarageCars, TotalBsmtSF, YearBuilt, FullBath, Neighborhood, LotArea, 1stFlrSF, TotRmsAbvGrd.

For every feature NOT exposed in the UI form, the inference engine fills in the **dataset median** (or mode, for categoricals) as a default value — computed once during Phase A and included in `model_metadata.json`. This keeps the model's full feature vector intact for prediction while keeping the actual form short.

---

## 5. TypeScript Inference Engine (Phase B)

```typescript
interface TreeNode {
  featureIndex: number;  // -1 if leaf
  threshold: number;
  left: number;
  right: number;
  value: number;
}

function predictTree(tree: TreeNode[], features: number[]): number {
  let nodeIdx = 0;
  while (tree[nodeIdx].featureIndex !== -1) {
    const node = tree[nodeIdx];
    nodeIdx = features[node.featureIndex] <= node.threshold ? node.left : node.right;
  }
  return tree[nodeIdx].value;
}

function predictRandomForest(
  model: { trees: TreeNode[][] },
  features: number[]
): { estimate: number; predictions: number[] } {
  const predictions = model.trees.map((t) => predictTree(t, features));
  const estimate = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  return { estimate, predictions };
}

function predictGradientBoosting(
  model: { trees: TreeNode[][]; learningRate: number; initValue: number },
  features: number[]
): number {
  return model.trees.reduce(
    (acc, tree) => acc + model.learningRate * predictTree(tree, features),
    model.initValue
  );
}
```

---

## 6. Confidence Range from Ensemble Spread

```typescript
function computeConfidenceRange(predictions: number[]): { low: number; high: number } {
  const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const variance = predictions.reduce((sum, p) => sum + (p - mean) ** 2, 0) / predictions.length;
  const stdDev = Math.sqrt(variance);
  return { low: mean - stdDev, high: mean + stdDev };
}
```

This is a legitimate technique specific to Random Forest — because it's an ensemble of independently-trained trees, the SPREAD of their individual predictions is a genuine (if simplified) uncertainty estimate. Gradient Boosting doesn't have the same natural spread property (its trees build sequentially on each other's errors, not independently), so display the confidence range only for the Random Forest prediction, or note the distinction explicitly if showing both models' outputs side by side.

---

## 7. Firestore Data Model (minimal — only for optional history)

```
/users/{uid}
  uid, email, displayName

/valuations/{valuationId}
  uid: string | null
  inputFeatures: Record<string, number>
  estimate: number
  confidenceRange: { low: number, high: number }
  modelUsed: "randomForest" | "gradientBoosting"
  createdAt: timestamp
```

No admin collection, no rules/knowledge-base management — the model is a static trained artifact loaded from /public/model/, not something edited through the app.

---

## 8. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /valuations/{valuationId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth == null || request.auth.uid == request.resource.data.uid;
      // anonymous valuations (uid: null) are allowed to be created but
      // not readable back later — they're ephemeral unless the user is
      // logged in when they run the valuation
    }
  }
}
```

Manual publish required in Firebase Console every time these rules change. Firebase is entirely optional for this project — if you skip login/history altogether, you can ship this with NO backend at all, purely static Next.js + the model JSON files.

---

## 9. Environment Variables

```
# Only needed if you implement optional login/history — otherwise this
# project needs zero environment variables
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_APP_URL=https://urbanprice.vercel.app
```

---

## 10. Non-Goals (out of scope — state these explicitly)

- No live retraining pipeline — the model is trained once in Colab and exported as a static artifact; retraining means re-running Phase A manually and redeploying updated JSON files
- No Nigerian/Enugu-specific dataset — explicitly out of scope per Section 1, benchmark dataset only
- No neural networks or deep learning — this project is specifically about tree ensembles, don't scope-creep into a different ML technique
- No real-time market data integration (comparable sales feeds, MLS APIs) — comparable properties shown are from the static training dataset, not live listings
- No native mobile app — responsive web, per your own scoping decision on "mobile interface" vs "mobile-based system"
