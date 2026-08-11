# UrbanPrice — DESIGN.md

**Product:** Automated Valuation Model (AVM) for urban housing units — ensembled regression trees (Random Forest + Gradient Boosting), trained offline in Python, served via a TypeScript inference engine, mobile-first responsive web interface.
**Target:** Anyone estimating property value — homeowners, buyers, agents. Public tool, optional login for saved history.
**Status:** Production-ready spec for Next.js 16 + Tailwind CSS v4 + React 19.
**Cost:** $0 — Firebase Spark (optional, history only), Vercel free tier, Google Colab for training (free).

---

## 1. Brand Identity

### Name & Positioning
**UrbanPrice** — plain, describes exactly what it does. This project's credibility comes from methodology, not branding personality — the design should read as a serious analytical tool, not a consumer lifestyle app.

### Color Palette — Light Mode, Financial/Analytical

| Role | Color | Hex | Use |
|---|---|---|---|
| Primary | Deep Slate | `#1E293B` | Headers, primary actions |
| Accent | Value Green | `#059669` | Estimate figures, positive/confident results |
| Confidence Band | Soft Amber | `#FCD34D` (low opacity) | Visualizing the prediction's uncertainty range |
| Background | Off-White | `#F8FAFC` | Main app background |
| Card BG | White | `#FFFFFF` | Cards, result panels |
| Border | Slate 200 | `#E2E8F0` | Dividers |
| Text Primary | Slate 900 | `#0F172A` | Headings |
| Text Secondary | Slate 500 | `#64748B` | Labels, metadata |

### Typography
- **Display (headers, the estimate figure itself):** Manrope 600 — clean, geometric, fintech/data-product character
- **Body:** Inter 400 — form labels, explanatory text
- **Mono (feature values, model metrics, RMSE/R² figures):** JetBrains Mono — genuinely functional here, not decorative; a statistic reads better fixed-width

### The Signature Moment: The Ensemble Reveal
This is the one place worth real visual investment, and it's directly tied to what the topic is actually about — not decoration bolted onto an unrelated concept.

On submitting a valuation: a small abstract visualization shows multiple simplified branching paths (representing individual decision trees in the ensemble) animating in sequence, each settling on a slightly different point, then converging, with the final estimate emerging as their combined result. The estimate figure counts up to its final value as this resolves. A soft amber band animates in around the number, representing the confidence range derived from the spread of individual tree predictions (per CONTEXT.md Section 3).

**Why this matters pedagogically, not just visually:** showing the individual trees' slightly different answers converging is an honest visualization of what an ensemble actually does — it doesn't hide the fact that this is many trees voting, it shows it. That's a stronger design choice than a generic loading spinner followed by a single number, because it reflects the actual mechanism the project is about.

Respect `prefers-reduced-motion`: skip the branch animation, show the final estimate and confidence band directly with a simple fade-in.

---

## 2. Page Map & Routing

```
/                              # Landing
/valuate                       # The core tool — input form + result
/methodology                   # Model comparison, evaluation metrics,
                                  dataset disclosure — this page is your
                                  defense credibility page, treat it seriously
/auth/login                    # Optional
/auth/signup                   # Optional
/history                       # Logged-in users: saved past valuations
```

Notably simple compared to your other portfolio projects — no admin panel, no roles beyond an optional logged-in/not-logged-in distinction. The model itself is a static trained artifact, not something managed through a UI.

---

## 3. Component Architecture

### Shells
- **PublicShell** — top bar (logo, Valuate/Methodology nav, optional login), footer

### Atoms
- **Button**, **Input**, **Select**, **Slider** (for numeric features like square footage), **Card**, **Spinner**, **Toast**

### Molecules
- **FeatureInput** — labeled input matched to the trained model's feature schema, with helper text explaining what it means and valid range
- **EnsembleReveal** — the signature moment, per Section 1
- **EstimateDisplay** — large Manrope figure, confidence range band below it, Value Green
- **MetricCard** — (methodology page) RMSE/MAE/R² displayed in mono, per model
- **ComparablePropertyCard** — a similar property from the training data, shown for context/trust

### Organisms
- **ValuationForm** — the reduced feature-set input form (top ~10-12 features by importance, per CONTEXT.md Section 4), submit triggers the TS inference engine
- **ValuationResult** — EnsembleReveal + EstimateDisplay + a short list of ComparablePropertyCards ("similar properties in the training data")
- **ModelComparisonPanel** — (methodology page) side-by-side Random Forest vs Gradient Boosting metrics, feature importance chart

---

## 4. Mobile-First / Responsive Spec

This is the actual "mobile interface" requirement — a single-column, comfortable, thumb-friendly form is the whole deliverable here, not a native app.

- ValuationForm: single column, one feature per row, large touch-friendly inputs/sliders, sticky "Get Estimate" button
- EstimateDisplay: large, center-stage on mobile — the number is the payoff, give it room
- Methodology page: metric cards stack vertically mobile, side-by-side desktop
- Tap targets 48px throughout

---

## 5. Page-by-Page UX Flow

### Landing (/)
```
[Header: Logo | Valuate | Methodology | Login]
[Hero: "Know what it's worth." + [Get an Estimate] CTA -> /valuate]
[Brief methodology teaser: "Built on ensembled regression trees, trained
 and validated against an established housing benchmark dataset" ->
 links to /methodology for full transparency]
```

### Valuate (/valuate)
```
[ValuationForm — top-importance features only, per CONTEXT.md Section 4]
  Overall Quality (1-10 slider)
  Living Area (sq ft)
  Garage Capacity (cars)
  Total Basement Area
  Year Built
  Full Bathrooms
  Neighborhood (select, if included in top features)
  Lot Area
  [+ a few more per actual trained feature importance ranking]
[Get Estimate button]
```

### Result (same page, post-submit)
```
[EnsembleReveal animation]
[EstimateDisplay: large figure, Value Green]
[Confidence range: "Likely between $X and $Y"]
[Comparable properties: 3-4 ComparablePropertyCards from training data
 with similar feature profiles]
[If logged in: automatically saved to history, else: "Log in to save
 this estimate"]
```

### Methodology (/methodology)
```
[H2: "How this works"]
[Explanation: ensemble regression trees, Random Forest vs Gradient
 Boosting, dataset disclosure]
[ModelComparisonPanel: MetricCards for both models — RMSE, MAE, R²]
[Feature importance chart — which inputs matter most to the prediction]
[Explicit dataset disclosure per CONTEXT.md Section 1's honesty note:
 "This model is trained and validated on the Ames Housing dataset
 (Iowa, USA) as a methodology benchmark. Production deployment for a
 specific local market would require locally-sourced transaction data."]
```

### History (/history) — logged-in only
```
[List of past valuations: date, key inputs, estimate, tap -> full result view]
```

---

## 6. Accessibility

- Contrast: Slate 900 on Off-White = 15.8:1 (WCAG AAA)
- All slider/numeric inputs have visible numeric labels, not just a slider handle position
- EnsembleReveal respects `prefers-reduced-motion`
- Confidence range always shown as text, not just the visual band

---

## 7. Empty & Loading States

```
Form incomplete: submit disabled, clear indication of which required
  fields remain
Calculating: brief "Running the ensemble..." state during EnsembleReveal
No history yet: "You haven't saved any estimates yet"
```

This DESIGN.md pairs with CONTEXT.md for the full technical architecture (including the Python training phase) and PROMPT.md for phase-by-phase scaffolding.
