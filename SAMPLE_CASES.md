# UrbanPrice — Sample Test Cases

Use these to sanity-check the app after setup or after redeploying.
Numbers below were produced by the model currently bundled in
`webapp/public/model/` — real data from 24,195 Nigerian property listings
across 25 states (see `webapp/README.md` §2 for the full disclosure,
including the listing-price-vs-sold-price caveat).

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

**Expected output:** Random Forest ≈ **₦101,000,000**, likely range
**₦97,600,000 – ₦104,400,000**. Gradient Boosting ≈ **₦116,700,000**. This
is the most "typical" profile in the dataset (median bedroom/bathroom
counts, most common property type, largest state by listing volume) —
the two models should land reasonably close together here.

## Case 2 — Large duplex, Abuja

| Field | Value |
|---|---|
| Bedrooms | 6 |
| Bathrooms | 6 |
| Toilets | 7 |
| Parking Spaces | 6 |
| State | Abuja |
| Property Type | Detached Duplex |

**Expected output:** Random Forest ≈ **₦319,000,000**, likely range
**₦187,000,000 – ₦451,000,000** (wide — few 6-bedroom listings in the
training data means less agreement across the ensemble's individual
trees, which the confidence range correctly surfaces). Gradient Boosting
≈ **₦417,000,000**.

## Case 3 — Modest bungalow, Ogun State (edge case, worth discussing in a defense)

| Field | Value |
|---|---|
| Bedrooms | 3 |
| Bathrooms | 3 |
| Toilets | 4 |
| Parking Spaces | 2 |
| State | Ogun |
| Property Type | Detached Bungalow |

**Expected output:** Random Forest ≈ **₦14,900,000**. Gradient Boosting ≈
**₦3,600,000** — a large disagreement between the two models. This isn't
a bug: 3-bedroom detached bungalows in Ogun State are a thin slice of
the training data, so Gradient Boosting's sequential, sharply-cutting
trees extrapolate poorly here while Random Forest's averaging smooths it
out. **This is genuinely useful methodology material** — it's a concrete,
honest demonstration of why comparing two model families (rather than
shipping one black-box number) has value, and why the confidence range
matters more on some inputs than others.

---

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
