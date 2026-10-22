# Task: rebuild first-time setup (onboarding) as a real step-by-step wizard

Project: `Erp design` (Vite + React + TS + Tailwind). All data comes from the demo store in `src/demo/` (`useDemo()`); never hardcode numbers in views. Read `SHELF_DEMO_INTEGRATION.md` first, especially sections 9 and 10.

## Why

`OnboardingCompleteView.tsx` is only a "you're done" page. Its stepper lists 7 steps (Business, Marketplaces, ERP catalogue, Catalogue loaded, Marketplace files, Output templates, Done) that don't exist as screens, and two of them aren't real user tasks:

- **"Catalogue loaded"** is the result of the ERP step, not a step.
- **"Output templates"** (the exact column layout each marketplace accepts for bulk upload) is the same for every retailer. We ship it built in. A retailer never sets it up.

## Wording (apply everywhere in the UI, not in code identifiers)

- Never show the word "template" to users.
- Incoming column setup = **"File mapping"** ("how Shelf reads your file"). Code: `inputTemplates`.
- Marketplace upload layout = **"upload format"** ("the file layout Talabat accepts"). Code: `outputTemplates`.
- On the File mapping page, make the "Outgoing files" section **read-only**. Remove the "Add template" button. When a marketplace has no format, show "Shelf can compare Keeta prices but can't create Keeta update files yet."

## The new flow: 4 steps + a results screen

Stepper labels: **1 Your store · 2 Marketplaces · 3 ERP file · 4 Marketplace files**, then the results screen (not a numbered step).

### Step 1: Your store
- Fields:
  - store name (prefilled from `state.tenant`)
  - branch
  - ERP system (dropdown; only "RetailOne" for now)
- Next is enabled when the name is filled.

### Step 2: Marketplaces
- A card per marketplace (Talabat, Snoonu, Rafeeq, Keeta) with a checkbox "I sell on this", saved as `Marketplace.enabled`.
- For each ticked marketplace, show a markup % input with a one-line explanation: "Your Talabat price = ERP price + 10%". Use the current `defaultMarkupPct` as the default.
- Validation:
  - at least 1 marketplace is ticked;
  - markup is a number from 0 to 100;
  - do not allow an empty value (no silent 0).
- Keeta note: "Comparison only, update files not available yet" (it has no upload format).

### Step 3: ERP file (required, cannot skip)
- Upload area plus "Use sample file". Reuse `uploadFile('erp', …)` / `uploadSample('erp')`.
- **If the columns are recognised:** show an inline summary: rows read, products found, rows with errors (expandable list). Button: **"Looks right, continue"**. It calls `confirmReview()`.
- **If the columns are not recognised:** show the column-mapping UI **inside the wizard**, not by navigating away. Extract the mapping table from `ColumnMappingView` into a reusable `<ColumnMappingPanel>` used by both places. Save, then show the summary, then continue.
- **Business rule (important):** on the very first ERP import (no prior ERP upload), all products become `status: 'active'`, not `'new'`. A store with 12,000 products can't fill in an Arabic name for each one before seeing any result.
  - Implement this in `applyReview` in `src/demo/uploads.ts`: `const firstImport = !s.uploads.some(u => u.source === 'erp')`.
  - Products arriving in later ERP files stay `'new'`, as today.
  - Arabic name comes from the ERP file when present. Category is guessed via `guessCategory`.

### Step 4: Marketplace files
- One row per marketplace **enabled in step 2**. Each row has:
  - Upload
  - Use sample
  - "Skip for now"
- The source is fixed per row (no source picker), so a file can't go to the wrong marketplace.
- Before mapping an unrecognised file, check its columns against the **other** sources' saved mappings (`detectTemplate` for each source). If it matches another source, warn: "This looks like a Snoonu file, not a Rafeeq file" and do not continue.
- Unrecognised layout (e.g. Keeta): inline `<ColumnMappingPanel>` as in step 3.
- After each file: a ✓ on the row and "62 products matched". Apply directly (`confirmReview()`); no separate review page in onboarding.
- **Finish** is always enabled. Skipped marketplaces show "No file yet" on the dashboard, which is the existing `no_data` behaviour.

### Results screen ("Your first check")
- The payoff: per enabled marketplace, the live numbers from `summary` ("Talabat: 8 problems: 5 stock, 3 price"), or "No file yet" for skipped ones.
- Primary button: **"See the problems"** → `navigate('dashboard')`.
- Secondary: a small "Your daily routine" card (3 lines: upload ERP → upload marketplace files → generate fix files).
- Move "Invite your team" to Settings (or keep it as a small optional link here). It's not part of setup.
- Set `state.onboarding.completedAt`.

## Logic and state

- Add to `DemoState`: `onboarding: { step: 1|2|3|4|5; completedAt: string | null }`. Bump `DEMO_VERSION` in `seed.ts` so old localStorage resets.
- Add `createEmptyState()` in `seed.ts`:
  - tenant, marketplaces, categories, categoryMappings, settings, the 3 built-in upload formats and the built-in ERP/Talabat/Snoonu/Rafeeq file mappings;
  - **no** products, listings, uploads, generated files or activity;
  - `onboarding.step = 1`.
- Store API additions: `setTenant`, `setMarketplaceEnabled(mp, bool)`, `setOnboardingStep(n)`, `completeOnboarding()`, `startNewCustomer()` (= `createEmptyState()`).
- **First-run gate:** if `onboarding.completedAt` is null, render the wizard full-screen (no sidebar) whatever the route. The user resumes at the saved step after a reload.
- **Back** is allowed on every step. Going back never deletes uploaded data; re-uploading in step 3/4 replaces it.
- **Disabled marketplaces:** Dashboard, reports, Generate files and the File mapping page show only `enabled` marketplaces. `summarize` and `needsAttention` should skip disabled ones.
- **Demo menu** (Header) gets two items:
  - "Start as new customer": `startNewCustomer()`, which opens the wizard.
  - "Reset to day-30 demo": the existing `resetDemo()`, which loads the full seed with `completedAt` set, so the client presentation still opens on a lived-in dashboard.

## Don't

- Don't add category mapping or upload-format setup to onboarding.
- Don't navigate to `upload-review` or `column-mapping` from inside the wizard; everything stays in the wizard.
- Don't hardcode counts; every number comes from `useDemo()`.
- Don't change daily-use screens beyond the "enabled marketplaces" filter and the wording above.

## Done when

1. **New-customer run:** Demo menu → "Start as new customer". Then:
   - step 1 → tick Talabat, Snoonu, Rafeeq, Keeta → ERP sample (recognised, 71 products, 2 error rows) → Talabat/Snoonu/Rafeeq samples (recognised) → Keeta sample (mapping panel appears, save) → results screen shows live numbers per marketplace;
   - "See the problems" → dashboard with the same numbers.
2. **Reload mid-wizard:** reloading at step 3 resumes at step 3.
3. **Disabled marketplace:** untick Rafeeq in step 2, and Rafeeq appears nowhere afterwards.
4. **Wrong file:** uploading the Snoonu sample in the Rafeeq row shows the "looks like a Snoonu file" warning.
5. **Day-30 reset:** "Reset to day-30 demo" restores the current presentation data.
6. **Checks:** `npx tsc --noEmit` and `npm test` pass. Add tests for the first-import rule (products active) and for `createEmptyState()`.
