# UrbanPrice — Sample Test Cases

Use these to sanity-check the app after setup or after redeploying.
Numbers below were produced by the model currently bundled in
`webapp/public/model/` — real data from 24,195 Nigerian property listings
across 25 states and 186 towns/cities, with a monotonic constraint on
Random Forest (see `webapp/README.md` §2 for the full disclosure).

Valid input ranges (from `training/model_metadata.json` → `uiRanges`):

| Feature | Min | Max |
|---|---|---|
| Bedrooms | 1 | 9 |
| Bathrooms | 1 | 9 |
| Toilets | 1 | 9 |
| Parking Spaces | 1 | 9 |
| State | 25 Nigerian states | |
| Town | Cascading — choose State first, then a state-specific list (e.g. 47 towns under Lagos, 53 under Abuja) | |
| Property Type | Detached Duplex, Terraced Duplexes, Semi Detached Duplex, Detached Bungalow, Block of Flats, Semi Detached Bungalow, Terraced Bungalow | |

---

## Case 1 — Duplex, Lekki (Lagos)

| Field | Value |
|---|---|
| Bedrooms | 4 |
| Bathrooms | 5 |
| Toilets | 5 |
| Parking Spaces | 4 |
| State | Lagos |
| Town | Lekki |
| Property Type | Detached Duplex |

**Expected output:** Random Forest ≈ **₦77,500,000**, range **₦74,100,000 –
₦80,800,000**. Gradient Boosting ≈ **₦111,400,000**.

## Case 2 — Same duplex, Ikoyi instead of Lekki (both Lagos)

Identical to Case 1, only `Town` changed from Lekki to **Ikoyi**.

**Expected output:** Random Forest ≈ **₦429,900,000** — over 5x Case 1,
despite every other input being identical. This is the whole point of
adding town-level granularity: Ikoyi and Lekki are both in Lagos State,
but the real market gap between them is enormous, and State alone can't
capture that. **This is the single best demo moment in the app** — show
the estimate change live by just switching the Town dropdown with
everything else held fixed.

## Case 3 — Large duplex, Maitama District (Abuja)

| Field | Value |
|---|---|
| Bedrooms | 6 |
| Bathrooms | 6 |
| Toilets | 7 |
| Parking Spaces | 6 |
| State | Abuja |
| Town | Maitama District |
| Property Type | Detached Duplex |

**Expected output:** Random Forest ≈ **₦755,800,000**, range
**₦708,200,000 – ₦803,300,000**. Gradient Boosting ≈ **₦680,900,000**.
Maitama is Abuja's most expensive district in this dataset — the highest
estimate you should be able to produce in the app.

## Case 4 — Bungalow, Ibadan (Oyo)

| Field | Value |
|---|---|
| Bedrooms | 3 |
| Bathrooms | 3 |
| Toilets | 4 |
| Parking Spaces | 2 |
| State | Oyo |
| Town | Ibadan |
| Property Type | Detached Bungalow |

**Expected output:** Random Forest ≈ **₦30,100,000**, range
**₦25,100,000 – ₦35,200,000**. Gradient Boosting ≈ **₦24,300,000**. A
useful "typical/affordable" reference point outside Lagos/Abuja.

---

## Monotonicity — verified, not assumed

Random Forest is trained with a monotonic constraint: predicted price
can never decrease as Bedrooms, Bathrooms, Toilets, or Parking Spaces
increase, holding everything else (including Town) fixed. Verify it
yourself: drag any of the four numeric sliders from min to max on
`/valuate` — the estimate should never go down. Full explanation and the
specific bug that motivated it are in `training/README.md`.

## Edge cases worth testing manually

- **Switching State** — confirm the Town dropdown immediately updates to
  that state's town list, and the previously-selected town is replaced
  automatically (it won't just be left dangling on an invalid pairing).
- **Minimum everything** (1 bed/bath/toilet/parking) — confirm the form
  doesn't error and the estimate stays positive and low.
- **Maximum everything** (9s across the board) — confirm no overflow/NaN.
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
