# UrbanPrice — Sample Test Cases

Use these to sanity-check the app after setup, after redeploying, or
after retraining with the real dataset. Numbers below were produced by
the **currently bundled synthetic-placeholder model** (see
`webapp/README.md` Section 2) — re-run this same check after you swap in
the real Ames Housing model and expect different (but plausible) numbers.

Valid input ranges for the model currently bundled (from
`training/model_metadata.json` → `uiRanges`):

| Feature | Min | Max |
|---|---|---|
| Overall Quality | 1 | 10 |
| Living Area (sq ft) | 334 | 3,136 |
| First Floor Area (sq ft) | 334 | 2,613 |
| Total Basement Area (sq ft) | 0 | 2,570 |
| Year Built | 1872 | 2010 |
| Year Remodeled | 1950 | 2010 |
| Garage Area (sq ft) | 0 | 1,418 |
| Lot Area (sq ft) | 1,300 | 42,206 |
| Total Rooms | 2 | 13 |
| Fireplaces | 0 | 3 |
| Full Bathrooms | 0 | 3 |

---

## Case 1 — Modest starter home

| Field | Value |
|---|---|
| Overall Quality | 4 |
| Neighborhood | OldTown |
| Living Area | 900 sq ft |
| First Floor Area | 900 sq ft |
| Total Basement Area | 700 sq ft |
| Year Built | 1940 |
| Year Remodeled | 1950 |
| Garage Area | 200 sq ft |
| Lot Area | 6,000 sq ft |
| Total Rooms | 5 |
| Fireplaces | 0 |
| Full Bathrooms | 1 |

**Expected output:** Random Forest ≈ **$248,300**, likely range
**$209,200 – $287,400**. Gradient Boosting ≈ **$248,500** (the two models
should land close together here — this is a "typical" profile near the
center of the training distribution).

## Case 2 — Mid-range family home

| Field | Value |
|---|---|
| Overall Quality | 6 |
| Neighborhood | CollgCr |
| Living Area | 1,600 sq ft |
| First Floor Area | 1,000 sq ft |
| Total Basement Area | 1,000 sq ft |
| Year Built | 1995 |
| Year Remodeled | 1998 |
| Garage Area | 480 sq ft |
| Lot Area | 9,500 sq ft |
| Total Rooms | 7 |
| Fireplaces | 1 |
| Full Bathrooms | 2 |

**Expected output:** Random Forest ≈ **$330,900**, likely range
**$306,800 – $354,900**. Gradient Boosting ≈ **$295,600**. The two
models diverging more here than in Case 1 is a good methodology
talking point — worth showing on the Methodology page's comparison.

## Case 3 — High-end new build

| Field | Value |
|---|---|
| Overall Quality | 9 |
| Neighborhood | NridgHt |
| Living Area | 2,800 sq ft |
| First Floor Area | 1,600 sq ft |
| Total Basement Area | 1,900 sq ft |
| Year Built | 2008 |
| Year Remodeled | 2008 |
| Garage Area | 850 sq ft |
| Lot Area | 15,000 sq ft |
| Total Rooms | 10 |
| Fireplaces | 2 |
| Full Bathrooms | 3 |

**Expected output:** Random Forest ≈ **$487,000**, likely range
**$414,800 – $559,300**. Gradient Boosting ≈ **$506,300**. Note the wider
confidence band here — fewer high-end training rows means more spread
across the ensemble's individual trees, which is exactly what the
confidence range is supposed to surface.

---

## Edge cases worth testing manually

- **Minimum everything** (Quality 1, smallest area/lot/year 1872, 0
  garage/fireplaces/baths) — confirm the form doesn't error and the
  estimate stays positive and low.
- **Maximum everything** — confirm no overflow/NaN and the estimate is
  the highest in the app.
- **Switching Neighborhood only, holding everything else fixed** — the
  estimate should shift by a plausible amount, demonstrating the
  neighborhood one-hot encoding is wired correctly.
- **`prefers-reduced-motion` enabled** (OS accessibility setting) — the
  EnsembleReveal animation should be skipped entirely; the estimate and
  confidence band should appear instantly via fade-in.

## Automated correctness check

Don't hand-verify the math above by re-deriving it — run:

```bash
cd webapp
npm run verify
```

This replays 5 real rows from the Python test set through the exact
TypeScript inference engine the app uses and confirms the numbers match
Python's own `.predict()` output to the cent. This is the check to run
(and screenshot/log for your defense) any time you retrain or touch
`lib/inference.ts`.
