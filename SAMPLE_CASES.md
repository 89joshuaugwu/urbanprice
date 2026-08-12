# UrbanPrice — Sample Test Cases

Use these to sanity-check the app after setup or after redeploying.
Numbers below were produced by the model currently bundled in
`webapp/public/model/` — real data from 24,195 Nigerian property listings
across 25 states, with a monotonic constraint on Random Forest (see
`webapp/README.md` §2 for the full disclosure).

Valid input ranges (from `training/model_metadata.json` → `uiRanges`):

| Feature | Min | Max |
|---|---|---|
| Bedrooms | 1 | 9 |
| Bathrooms | 1 | 9 |
| Toilets | 1 | 9 |
| Parking Spaces | 1 | 9 |
| State | 25 Nigerian states | |
| Property Type | Detached Duplex, Terraced Duplexes, Semi Detached Duplex, Detached Bungalow, Block of Flats, Semi Detached Bungalow, Terraced Bungalow | |

---

## Case 1 — Standard duplex, Lagos

| Field | Value |
|---|---|
| Bedrooms | 4 |
| Bathrooms | 5 |
| Toilets | 5 |
| Parking Spaces | 4 |
| State | Lagos |
| Property Type | Detached Duplex |

**Expected output:** Random Forest ≈ **₦108,700,000**, likely range
**₦104,400,000 – ₦113,000,000**. Gradient Boosting ≈ **₦116,700,000**.

## Case 2 — Large duplex, Abuja

| Field | Value |
|---|---|
| Bedrooms | 6 |
| Bathrooms | 6 |
| Toilets | 7 |
| Parking Spaces | 6 |
| State | Abuja |
| Property Type | Detached Duplex |

**Expected output:** Random Forest ≈ **₦454,800,000**, likely range
**₦419,300,000 – ₦490,300,000**. Gradient Boosting ≈ **₦416,500,000**.

## Case 3 — Modest bungalow, Ogun State (edge case, worth discussing in a defense)

| Field | Value |
|---|---|
| Bedrooms | 3 |
| Bathrooms | 3 |
| Toilets | 4 |
| Parking Spaces | 2 |
| State | Ogun |
| Property Type | Detached Bungalow |

**Expected output:** Random Forest ≈ **₦17,400,000**. Gradient Boosting ≈
**₦3,600,000** — a large disagreement between the two models. 3-bedroom
detached bungalows in Ogun State are a thin slice of the training data,
so Gradient Boosting's sequential, sharply-cutting trees extrapolate
poorly here while Random Forest's constrained, averaging structure holds
up better. Good, honest methodology material for a defense — it's a
concrete demonstration of why comparing two model families matters, and
why the confidence range is wider on some inputs than others.

---

## Monotonicity — verified, not assumed

Random Forest is trained with a monotonic constraint: predicted price
can never decrease as Bedrooms, Bathrooms, Toilets, or Parking Spaces
increase, holding everything else fixed. This matters because on a real,
somewhat sparse dataset (~24k rows across 6 features), unconstrained
trees can otherwise extrapolate in counter-intuitive directions for rare
combinations (e.g. a model naively trained without this constraint
priced a 2-bedroom Lagos duplex *lower* than a comparable 1-bedroom one,
because that exact combination was thin in the training data) — which
reads as "broken" in a live product even though it's technically
consistent with the data. The constraint costs a small amount of raw
fit (R² 0.276 → 0.237) in exchange for predictions that always move the
direction a user expects. This trade-off, and the specific example that
motivated it, is worth mentioning in a defense — it shows a real
debugging/design decision, not just default parameters.

Verify it yourself: drag any of the four numeric sliders on `/valuate`
from min to max, holding everything else fixed — the estimate should
never go down.

## Edge cases worth testing manually

- **Minimum everything** (1 bed/bath/toilet/parking) — confirm the form
  doesn't error and the estimate stays positive and low.
- **Maximum everything** (9s across the board) — confirm no overflow/NaN.
- **Switching State only, holding everything else fixed** — the estimate
  should shift by a plausible amount (Lagos and Abuja listings skew
  higher than most other states in this data).
- **`prefers-reduced-motion` enabled** — the EnsembleReveal animation
  should be skipped entirely; the estimate and confidence band should
  appear instantly via fade-in.

## Automated correctness check

Don't hand-verify the math above — run:

```bash
cd webapp
npm run verify
```

This replays 5 real rows from the Python test set through the exact
TypeScript inference engine the app uses and confirms the numbers match
Python's own `.predict()` output to the cent (or kobo). Run this any time
you retrain or touch `lib/inference.ts`, and keep the PASSED output
handy for your defense.
