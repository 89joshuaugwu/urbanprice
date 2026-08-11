"""
Generates public/model/comparable_properties.json — a small bundled
sample of training-data rows used by the "similar properties" UI element
(PROMPT.md Phase 3: nearest-neighbor by feature distance, kept simple —
a trust-building UI element, not a core algorithm).

Run this AFTER generate_synthetic_ames.py (or after re-running Phase 0
against the real dataset) so it samples from the same CSV.
"""

import pandas as pd
import json

df = pd.read_csv("ames_housing_synthetic.csv")
sample = df.sample(60, random_state=7)[["Neighborhood", "OverallQual", "GrLivArea", "YearBuilt", "SalePrice"]]

rows = []
for i, r in sample.iterrows():
    rows.append({
        "id": f"comp-{i}",
        "neighborhood": r["Neighborhood"],
        "overallQual": int(r["OverallQual"]),
        "grLivArea": int(r["GrLivArea"]),
        "yearBuilt": int(r["YearBuilt"]),
        "salePrice": int(r["SalePrice"]),
    })

with open("comparable_properties.json", "w") as f:
    json.dump(rows, f, indent=2)

print(f"Wrote comparable_properties.json ({len(rows)} rows)")
