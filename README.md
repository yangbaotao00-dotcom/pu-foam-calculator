# YHRHX PU Foam Calculator

**Free open-source polyurethane expanding foam usage estimator** for construction joints, windows, and doors. English and Spanish pages. Works on mobile and desktop without a database, paid API, or tracking code.

> **Project status:** Version 1 source package for code review. Not yet published. Do not treat it as a product specification, safety certification, or guaranteed consumption rate.

## What it does

- English entry page: `/index.html`
- Spanish entry page: `/es/index.html`
- Metric: joint length in meters, width/depth in millimeters, and free-foam yield in liters per can
- Imperial: length in feet, width/depth in inches, and free-foam yield in cubic feet per can
- Editable assumptions for usable yield percentage and extra waste allowance
- Estimated joint volume, usable yield per can, and whole cans required
- Input errors and separate content pages with explanations, cautions, and clear manufacturer links

## Estimation method

Metric joint volume in liters:

```text
joint_volume_L = length_m * width_mm * depth_mm / 1000
usable_yield_L = nominal_free_foam_yield_L * utilization_percent / 100
adjusted_volume_L = joint_volume_L * (1 + waste_percent / 100)
whole_cans = ceil(adjusted_volume_L / usable_yield_L)
```

Conversions:

```text
1 foot = 0.3048 meters
1 inch = 25.4 millimeters
1 cubic foot = 28.316846592 liters
```

**Important:** The nominal *free-foam yield* is an input supplied by the user, not a claim by YHRHX. The displayed 75% usable-yield and 10% waste values are editable **illustrative assumptions**, not measured performance data or recommendations for a specific project. Real consumption depends on site and product conditions. No claim is made about fire resistance or other certifications.

### Input boundaries

- Positive joint length up to 1,000,000 meters
- Positive joint width and depth up to 10,000 millimeters
- Nominal yield: 0.01–100,000 liters per can
- Usable-yield assumption: 1–100%
- Waste allowance: 0–100%
- A value is required in each field; impossible and non-finite inputs are rejected.

## Preview locally

You can open `index.html` directly in a modern browser. For module imports, browsers may restrict `file://` access; in that case serve the folder locally:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000/` for English and `http://localhost:8000/es/` for Spanish.

## Automated tests

Requires Node.js 18+ and **no dependency installation**.

```sh
npm test
npm run check
```

`tests/calculator.test.js` contains 15 `node:test` cases that cover math, rounding, unit conversions, validation, and boundary conditions. `.github/workflows/test.yml` runs these checks on PRs and on pushes to the feature branch. It **does not deploy** anything.

## GitHub Pages (only after approval)

This version is authored to run from the project path `/pu-foam-calculator/`. All CSS, scripts, and language links are relative. If and only if the PR is reviewed and merged, the repository owner may separately choose **Settings → Pages → Deploy from a branch → main / root**. This does not need to be enabled while reviewing this first draft. No Pages workflow is included.

## Repository upload safety

**Do not upload the ZIP file itself as a repository source file.** Unzip first. When uploading through GitHub's browser, choose **Create a new branch for this commit** named `feature/calculator-v1`, not a direct commit to `main`. Confirm that files land in the repository **root** (`index.html`, `es/index.html`, `assets/styles.css`, `src/*.js`, `tests/*.js`, `.github/workflows/test.yml`, `README.md`, and `package.json`). Keep the repository's existing MIT `LICENSE` file unchanged. Open a PR for review, **do not merge or publish yet**.

## Website

- YHRHX manufacturer: https://yhrhx.com/
- Products: https://yhrhx.com/products
- Spanish products: https://yhrhx.com/es/products

This tool is independently maintained; YHRHX product claims, shipping details, and quotation terms must be confirmed with the manufacturer.

## License

The repository already includes an MIT `LICENSE` file. Preserve it when uploading this source package.
