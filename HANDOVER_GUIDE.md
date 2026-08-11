# UrbanPrice — Project Review & Handover Guide

This document is a comprehensive breakdown and technical guide for **UrbanPrice**, an Automated Valuation Model (AVM) for the Nigerian housing market. Use this guide to understand the codebase, explain it to clients or project stakeholders, and hand it over smoothly.

---

## 1. Executive Summary & Review

**UrbanPrice** is a high-performance web application designed to estimate residential real estate values across Nigeria in Naira (₦). 

### Key Project Architecture
- **Offline Training Phase (Python)**: Trains Machine Learning ensemble models (Random Forest + Gradient Boosting) on real property data and flattens the trained decision trees into lightweight **JSON files**.
- **In-Browser Inference Phase (Next.js / TypeScript)**: A custom TypeScript binary tree traversal engine runs directly in the user's browser, consuming the static tree JSON files.

### Why This Design is Excellent
1. **Zero Server Costs ($0)**: No Python server (Flask/FastAPI/Django) or ML API endpoints are needed. The web app is static and hosted for free on Vercel.
2. **Instant Predictions**: Valuation occurs locally in < 1ms inside the user's browser.
3. **Offline & Mobile First**: Small model sizes (~1.3 MB) optimize loading on mobile connections in Nigeria.
4. **Verification Proven**: Running `npm run verify` proves that the TypeScript inference engine matches Python `scikit-learn` outputs with 0 error margin.

---

## 2. Deep Dive: How the Training Data Was Created & Processed

### A. Data Origin & Source
- **Source**: Sourced from Kaggle (**Nigeria Houses and Prices Dataset** by Abdullahi Yunus) and mirrored on GitHub (`temiobasa`).
- **Dataset Size**: **24,195 cleaned property listings** across **25 Nigerian states**.
- **Features Captured**: Bedrooms, Bathrooms, Toilets, Parking Spaces, Property Type, State, Listing Price.

> ⚠️ **Note on Legacy Synthetic Files**: If you see `generate_synthetic_ames.py` or `ames_housing_synthetic.csv` in `training/`, these were initial mock scripts used during early prototyping. **They are NOT used by the active app.** The active model trains exclusively on `nigeria_houses_raw.csv`.

### B. Step-by-Step Data Cleaning Pipeline (`training/generate_nigeria_model.py`)

1. **Filtering Scraping Errors / Outliers**:
   - Dropped property listings with prices below **₦2,000,000** (unrealistic for a full house listing).
   - Dropped prices above the **99.5th percentile** (removing multi-trillion Naira data entry typos).
   - Cleaned count: Dropped 131 bad rows out of 24,326 raw rows.

2. **Column Standardization**:
   - Renamed fields to standard names: `Bedrooms`, `Bathrooms`, `Toilets`, `ParkingSpace`, `PropertyType`, `State`, `SalePrice`.

3. **Handling Sparsity (`town` vs `State`)**:
   - Dropped `town` column (189 distinct values were too sparse for the dataset size and caused severe overfitting).
   - Maintained `State` (25 states) as the primary location signal.

4. **Categorical Feature Encoding (One-Hot Encoding)**:
   - Numerical fields (4): `Bedrooms`, `Bathrooms`, `Toilets`, `ParkingSpace`.
   - Categorical fields (2): `State` (25 states) and `PropertyType` (7 types).
   - Converted using `pd.get_dummies()`. This results in **36 total encoded features** fed into the model.

5. **Train / Test Split**:
   - 80% used for training (`X_train`), 20% reserved for evaluation (`X_test`).

### C. Critical Modeling Decision: Raw Naira vs. Log-Transformed Price

- Real estate prices are heavily right-skewed (a few luxury mansions cost billions, while average homes cost millions).
- **Log Transformation Experiment**: Training on `log1p(price)` improved *log-space* $R^2$ from 0.28 to 0.52.
- **The Issue**: When converting log predictions back to raw Naira using `expm1`, the raw-Naira scale $R^2$ dropped to **0.17** because small errors in log space expand into massive error swings on high-end homes when exponentiated.
- **Final Decision**: The model was trained directly on **raw Naira values** ($R^2 \approx 0.28$), prioritizing accurate real-world Naira estimates over artificial log-scale metrics.

---

## 3. How the Machine Learning & Client Inference Works

### A. Ensemble Models Trained
1. **Random Forest (50 Trees, Max Depth 8)**:
   - Builds 50 independent decision trees.
   - The final price estimate is the average of all 50 trees.
   - **Confidence Range**: The standard deviation across all 50 individual tree predictions determines the upper and lower confidence bound (`low` / `high`). High variation = higher uncertainty.
2. **Gradient Boosting (80 Trees, Max Depth 3)**:
   - Builds 80 shallow trees sequentially, where each tree fixes the residual errors of the previous trees.

### B. Exporting Trees to JSON
Instead of saving binary `.pkl` files, `generate_nigeria_model.py` uses `export_tree()` to flatten each decision tree into a plain array of node objects:
```json
{
  "featureIndex": 4,
  "threshold": 0.5,
  "left": 1,
  "right": 2,
  "value": 85000000.0
}
```
If `featureIndex == -1`, it is a leaf node holding the predicted price (`value`).

### C. Client-Side TypeScript Traversal (`webapp/lib/inference.ts`)
When a user submits inputs on the web app, the TypeScript engine runs a simple `while` loop for each tree:
```typescript
export function predictTree(tree: TreeNode[], features: number[]): number {
  let nodeIdx = 0;
  while (tree[nodeIdx].featureIndex !== -1) {
    const node = tree[nodeIdx];
    nodeIdx = features[node.featureIndex] <= node.threshold ? node.left : node.right;
  }
  return tree[nodeIdx].value;
}
```
This binary traversal runs instantly in the browser without sending any network request.

---

## 4. Key Disclosures for Handover & Defense

When presenting this project to a client, supervisor, or evaluator, highlight these 3 points for complete transparency:

1. **Asking Prices vs. Closed Sales**:
   - The dataset consists of online property portal asking prices, not verified deed/closing prices. Asking prices tend to be 10–20% higher than final negotiated sales.
2. **Feature Set Constraints**:
   - The original scraped dataset only contains 6 features (bedrooms, bathrooms, toilets, parking spaces, state, property type). It lacks square meters, exact micro-neighborhood, and structural condition. This explains why the model's $R^2$ is ~0.28.
3. **Model Disagreements (e.g. Rare Property Types in Sparse States)**:
   - Surfacing both Random Forest and Gradient Boosting side-by-side helps users identify input cases where data is sparse (e.g., a bungalow in Ogun state will show divergence between models, indicating higher estimation uncertainty).

---

## 5. Quick Commands Guide

### Run Web App Locally
```bash
cd webapp
npm install
npm run dev
```
Access at `http://localhost:3000`.

### Verify ML Math Correctness
```bash
cd webapp
npm run verify
```
Outputs `PASSED` if TypeScript inference matches Python outputs on test samples.

### Retrain Model (Python Phase)
```bash
cd training
python generate_nigeria_model.py
cp random_forest.json gradient_boosting.json model_metadata.json verification_samples.json comparable_properties.json ../webapp/public/model/
cd ../webapp
npm run verify
```
