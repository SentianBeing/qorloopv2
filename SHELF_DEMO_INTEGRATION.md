# Shelf demo: make the front end work on the dummy database

**For Antigravity.** Claude has added a working data layer in `src/demo/`, plus sample Excel files in `public/samples/`. Your job is to connect the existing screens to it so the whole flow works in the browser with no backend. Do the tasks in order and tick them off. Do not change anything in `src/demo/` except where a task says so. If something there looks wrong, write it under "Questions for Claude" at the bottom of this file instead.

Run `npm install` first (package.json now includes `xlsx`, `vitest`, `tsx`). `npm test` must stay green.

---

## 0. What is already built (`src/demo/`)

| File | What it does |
|---|---|
| `types.ts` | Data model: `DemoState`, `Product`, `Listing`, `UploadRecord`, `PendingReview`… |
| `catalogData.ts` | 67 realistic Qatar supermarket products with Arabic names, 12 categories, marketplace category names |
| `seed.ts` | `createSeed()`: the dummy database. Demo clock is fixed at **06 Oct 2026 09:14 (Asia/Qatar)**. ERP and Talabat files are from yesterday (stale), Snoonu and Rafeeq from this morning, Keeta never uploaded |
| `pricing.ts` | `expectedPrice(erpPrice, markupPct)` = ERP selling price + markup, rounded to 0.05 QAR; barcode normalisation |
| `recon.ts` | **The only place mismatches are computed.** `summarize()`, `allRows()`, `rowsForProduct()`, `stockMismatches()`, `priceMismatches()`, `needsAttention()` |
| `uploads.ts` | Reading an uploaded sheet: template detection, column mapping (`suggestMapping`, `ERP_FIELDS`, `MARKETPLACE_FIELDS`), review (`buildReview`), apply (`applyReview`) |
| `exports.ts` | Corrected marketplace files in each marketplace's exact column layout: `previewFile()`; `simulateMarketplaceAccepted()` for the demo ending |
| `xlsxIO.ts` | SheetJS read/write: `readSpreadsheet(file)`, `downloadXlsx(...)` |
| `format.ts` | `money`, `signedMoney`, `dateTime`, `relative(iso, now)` → "today 09:12", "yesterday 18:40" |
| `store.tsx` | `<DemoProvider>` + `useDemo()`: state, actions, localStorage persistence, `resetDemo()` |
| `__tests__/flow.test.ts` | End-to-end tests of the daily loop |
| `../../scripts/make-samples.ts` | Regenerates `public/samples/*.xlsx` from the seed (`npx tsx scripts/make-samples.ts`) |

### Key rules (already implemented, don't re-implement in components)
- **Stock is compared as availability, not quantity.** Real Talabat/Snoonu files only have True/False. A stock issue is either `unavailable_but_in_stock` (lost sales) or `available_but_out_of_stock` (urgent: customers can order stock that doesn't exist). Never show "marketplace stock 80, difference −40".
- **Expected price = ERP selling price + markup** (marketplace default or product override). Defaults: Talabat 10%, Snoonu 10%, Rafeeq 8%, Keeta 12%.
- **Totals:** `total = stock + price`. Use `summary[mp].stock`, `.price`, `.total` everywhere. Never type a count.
- **No file = no data.** Keeta shows "No data" / "Upload a Keeta file to compare" until a Keeta file is uploaded.
- **ERP owns** barcode, name, price, stock, active. **Shelf owns** Arabic name, category, image, markups, status (active / inactive / new). An ERP upload never overwrites Shelf-owned fields.

### `useDemo()` API
```ts
const {
  state, summary, attention, pendingMapping, pendingReview,
  uploadFile, uploadSample, completeMapping, cancelMapping, confirmReview, discardReview,
  setMarketplaceMarkup, setProductMarkup, updateProduct, activateProducts, setCategoryMapping, configureOutputTemplate,
  preview, generate, redownload, markAcceptedByMarketplace, resetDemo,
} = useDemo();
// uploadFile/uploadSample return { next: 'review' | 'mapping' | 'error' }: navigate accordingly.
```

---

## 1. Plumbing
- [ ] Wrap the app in `<DemoProvider>` in `src/main.tsx` (outside `AppProvider`).
- [ ] **URL routing.** Replace the `currentView` switch with hash routes so Back and refresh work and the presenter can jump to a screen. Simplest: keep `navigate(view, opts)` but sync it to `window.location.hash` (`#/reports/price`, `#/catalogue/p001`) and read the hash on load and on `hashchange`.
- [ ] Remove the hard-coded arrays in every view; read from `useDemo()`. `AppContext` keeps only UI things (current view, toasts, modal open state). Delete `INITIAL_PRODUCTS` / `generateMarketplaceFiles` / `addProduct` / `deleteProduct` usage.
- [ ] Header: tenant name from `state.tenant.name`, user from `state.currentUser`. Hide the branch switcher (it changes nothing). Add a small **Demo** menu with "Reset demo data" → `resetDemo()`.
- [ ] Marketplace names as neutral text chips. Replace the coloured t / S / R / K logo tiles in `MarketplaceBadge` and table headers with plain text labels (client-approved).

## 2. Dashboard (`DashboardView.tsx`)
- [ ] Data source cards: last upload per source via `summary[mp].lastUpload` (ERP via `latestUpload(state,'erp')`), shown with `relative(uploadedAt, state.now)`. Dot green / amber (`isStale`) / grey (no file). ERP card shows the active product count from `state.products`.
- [ ] Mismatch tiles from `summary[mp]`: big number = `total`, line "`stock` stock · `price` price". Keeta: the "Upload a Keeta file to compare" tile when `!hasData`. If `isStale`, add a small amber "Older than 12 hours" note on the tile.
- [ ] Tile click → **Price discrepancies** filtered to that marketplace (not the "Price mismatches" screen). "Stock" link → Stock report filtered to that marketplace.
- [ ] **Remove** the "Marketplace vs marketplace" section.
- [ ] "Needs attention" from `attention` (`needsAttention()`); each item's action: `new-products` → New products screen, `upload` → open upload modal with that source, `missing` → Catalogue filtered to "Missing from ERP", `templates`, `category-mapping`.
- [ ] "Run comparison again": toast "Comparison is up to date" (counts are always live).

## 3. Upload flow
### Upload modal (`UploadModal.tsx`)
- [ ] Bug: the selected source is set once at mount. Re-sync `source` from `uploadModalPreselectedSource` every time the modal opens.
- [ ] Real file input + drag & drop (`.xlsx,.xls,.csv`). On Upload call `uploadFile(source, file, contains)`.
- [ ] Add a link **"Use today's sample file"** under the drop zone → `uploadSample(source, contains)`. (The presenter uses these; see `SAMPLE_FILES` in `store.tsx`.)
- [ ] Show "Shelf will recognise the layout…" only if a template exists for that source; for Keeta show "First Keeta file: you'll match the columns once".
- [ ] After upload: `next === 'mapping'` → Column mapping screen; `'review'` → Upload review; `'error'` → show the message inline.

### Column mapping (`CategoryMappingView.tsx` → rename to `ColumnMappingView.tsx`)
- [ ] This screen is **column mapping**, reached only from the upload flow (`pendingMapping`). Remove it from the sidebar item "Category mapping" (that item gets the real category mapping screen, section 6).
- [ ] Breadcrumb: Uploads / {fileName} / Map columns.
- [ ] Rows = `fieldsFor(pendingMapping.source)` (`ERP_FIELDS` or `MARKETPLACE_FIELDS`), each a `<select>` of `pendingMapping.headers`, preselected from `pendingMapping.suggested`. Sample value = first row's value for the chosen column.
- [ ] Preview table = first 10 `pendingMapping.rows` using the chosen columns. "Unmapped columns" = headers not chosen.
- [ ] Save requires all `required` fields. Template name input (default "Keeta menu export"). Save → `completeMapping(fields, name)` → Upload review.

### Upload review (`UploadReviewView.tsx`)
- [ ] Everything from `pendingReview`: file name, source label, `contains`, summary tiles (`summary.rowsRead`, `matched`, `newProducts`, `rowsWithErrors`, `priceChanges`, `stockChanges`, `missingFromFile`).
- [ ] Wording by source. ERP: "Stock changes". Marketplace: "Availability changes", plus an "Unmatched rows" tab (`unmatched`) explaining "These rows are on Snoonu but not in your catalogue".
- [ ] **Tabs must switch the table:** Price changes (`priceChanges`, old → new), Stock or Availability changes, New products (`newProducts`, ERP only), Missing (`missing`), Errors (`errors`: row, column, value, reason).
- [ ] Steps bar: all done up to Review. "Detected layout" = template name from `state.inputTemplates`.
- [ ] Confirm and apply → `confirmReview()` → toast "Applied: N price changes, M stock changes" → **back to Dashboard** (counts update). Cancel → `discardReview()`.
- [ ] Price change values in neutral text (no green).

### Uploads history (new, small)
- [ ] Sidebar "Uploads" → table of `state.uploads`: date (`dateTime`), source, file, contains, uploaded by, rows, status. If `pendingReview` exists show it on top with "Continue review".

## 4. Reports
### Price discrepancies (`PriceDiscrepanciesView.tsx`): the main price screen
- [ ] Rows: products with at least one `priceMismatch` (`priceMismatches(state)`, grouped by product). Columns: Barcode, Product (+ Arabic), ERP price (QAR), then per marketplace **Expected / Actual**; mismatch cell red-tinted with `signedMoney(priceDiff)`. Keeta columns show "No data" while `!summary.keeta.hasData`.
- [ ] Comment column computed: "Lower on Talabat", "Higher on Rafeeq"…
- [ ] Tabs with live counts: Stock (`Σ summary.stock`), Price (`Σ summary.price`), Generated files (`state.generatedFiles.length`).
- [ ] Freshness strip from real upload times. If any marketplace `isStale`, show an amber line "Talabat data is 15 hours old".
- [ ] Filters work: marketplace, direction (lower / higher), "difference above".
- [ ] Row click → Product detail. "Generate price files" → Generate files with kind = price.
- [ ] Remove the sparkle icon.

### Stock report (`StockMismatchesView.tsx`)
- [ ] Rows: `stockMismatches(state, mp?)`. Columns: Product, Barcode, **ERP stock**, **ERP status** (In stock / Out of stock / Inactive), **Marketplace status** (Available / Unavailable), **Issue** ("Unavailable on Talabat, in stock in ERP" in amber; "Available on Snoonu, out of stock in ERP" in red, sorted first), Marketplace, Last updated.
- [ ] Tabs All / per marketplace with counts from `summary`. Filter panel counts computed (issue type, marketplace, category).
- [ ] "Generate stock file" → Generate files with kind = stock.

### Price mismatches (`PriceMismatchesView.tsx`)
- [ ] **Remove from navigation** (it compares ERP vs marketplace without markup). Keep the file only if needed elsewhere.

## 5. Generate files (`GenerateFilesView.tsx`)
- [ ] Breadcrumb "Reports / Generate files". Per marketplace row: counts from `summary`, include = mismatches only / all **listed** (`summary.listed`), file kind (Stock + price / Stock / Price / New products). Keeta row disabled while `!hasData`, with "Upload Keeta file".
- [ ] **Preview changes opens a dialog on this page** (`preview(mp, kind, scope)`): product count, price changes, availability changes, largest price change ("Nescafe Classic 200g 17.50 → 19.80"), first 10 `sheetRows` in the marketplace's own columns. If `blockedReason`, show it and disable generate.
- [ ] Generate is enabled per marketplace only after its preview was opened. Generate → `generate(preview, format)` (downloads a real .xlsx in Talabat/Snoonu/Rafeeq format and records it).
- [ ] After generating, show a success panel: "Upload Talabat_Update_06Oct2026_0914.xlsx to the Talabat seller portal" + a demo-only button **"Simulate: Talabat accepted the file"** → `markAcceptedByMarketplace(preview)` → Talabat drops to 0 mismatches. (Label it clearly as a demo action.)
- [ ] Remove "Price rounding" (rounding lives in the price rule). Keep Excel/CSV.
- [ ] Recent output files = `state.generatedFiles` with Download → `redownload(id)`.

## 6. Catalogue
### Catalogue list (`CatalogueView.tsx`)
- [ ] From `state.products`. Tabs: All, Active, Inactive, New, **Missing from ERP** (`!inLatestErpFile`). Columns: product, barcode, category (Shelf category name), brand, ERP price, ERP stock, status, marketplaces (e.g. "3 of 4 listed"), updated.
- [ ] Search by name / barcode / SKU; filters work. Row → Product detail. "Import from ERP" → upload modal with source ERP. Hide "Add product" (out of Phase 1 scope).

### Product detail (`ProductDetailView.tsx`)
- [ ] Product from the URL id. Marketplace table from `rowsForProduct(state, id)`: listing status, markup (with "custom" tag if override), expected, actual, diff, availability, last updated, status pill (In sync / Mismatch / Not listed / No data).
- [ ] Shelf-managed fields (Arabic name, category, markup) tagged "Managed in Shelf" and editable: Arabic name and category → `updateProduct`; markup per marketplace → `setProductMarkup` (blank = use marketplace default). **Mismatches update instantly.** This is a key demo moment.
- [ ] ERP fields (name, barcode, ERP price, cost, stock) read-only with "From ERP" tag.
- [ ] History tab from `state.activity` for this product.
- [ ] Remove "Delete product"; keep "Mark as inactive" (`updateProduct(id,{status:'inactive'})`).

### New products (new screen)
- [ ] Sidebar badge = number of `status === 'new'`. Table of new products with **inline** inputs: Arabic name, category (select from `state.categories`), and a read-only expected price per marketplace. Rows missing Arabic name or category show "Needs: Arabic name".
- [ ] Select → "Activate selected" → `activateProducts(ids)`; toast with activated / skipped. Activated products now appear as "Not listed" and go into a **New products** file on Generate files.

### Markups (`MarkupsView.tsx`)
- [ ] Top: marketplace defaults (editable %) → `setMarketplaceMarkup`. Below: products with overrides (`state.markups`) and a search to add one. Show the effect: "Talabat price mismatches: 3 → 5" after a change.

### Category mapping (sidebar item; new content)
- [ ] Table: Shelf category × marketplace → marketplace category text (`state.categoryMappings`), editable → `setCategoryMapping`. Empty cells highlighted "Needed for new-product files". (Rafeeq has 2 unmapped; Keeta has none mapped.)

### Templates (`TemplatesView.tsx`)
- [ ] Input templates from `state.inputTemplates` (source, name, version, mapped fields). Output templates from `state.outputTemplates`; Keeta "Not configured" → "Add template" → `configureOutputTemplate('keeta')`.

## 7. Hide for the client demo
- [ ] Categories screens, Add product, Price mismatches, Settings details beyond a placeholder.
- [ ] Sidebar "Help" must not open Onboarding. Add a separate "Start tour" link (Header Demo menu) that opens `OnboardingCompleteView`.

## 8. Demo script (must work end to end)
1. Reset demo → Onboarding complete (via "Start tour") → Go to dashboard.
2. Dashboard: ERP and Talabat **stale**, Keeta no file. Talabat 8, Snoonu 7, Rafeeq 3 mismatches; 3 new products.
3. Upload ERP → "Use today's sample file" → review: 73 rows, 65 matched, **6 new**, **2 errors**, 7 price changes, 2 missing → Confirm → dashboard updates (9 new products, 2 missing from ERP).
4. Upload Talabat sample → review shows 1 price change, 2 availability changes → Confirm → Talabat now fresh.
5. Price discrepancies → Pepsi: Talabat expected 2.75, actual 2.50 → open Pepsi → change Talabat markup 10% → 0% → Pepsi Talabat becomes in sync (then set it back).
6. Stock report → "Available on Snoonu, out of stock in ERP" (Al Ain Water) at the top.
7. Generate files → Talabat → Preview → Generate → real Excel downloads in Talabat's format → "Simulate: Talabat accepted" → Talabat 0.
8. Upload Keeta sample → **Map columns** (first time) → save → review → Confirm → Keeta tile appears with its mismatches; the next Keeta upload is recognised automatically.
9. New products → fill Arabic name + category for 2 → Activate → Generate files → Talabat, kind New products → preview.

## Done when
- [ ] Every number on every screen comes from `useDemo()`; `grep -rn "12,480\|136)\|(214)" src/components` finds nothing.
- [ ] The demo script above works start to finish, refresh keeps state, Reset brings it back.
- [ ] `npm test` and `npm run lint` pass; `npm run build` succeeds and deploys to Vercel (`public/samples` is served).

## Questions for Claude
(write here)

## 10. Category mapping: removed from the sidebar (decision, 15 Oct)

Category mapping is only used for **new-products files**. Daily stock/price files never need it, so it is no longer a sidebar item or a dashboard "Needs attention" task. Please don't add it back.

- Shelf asks for a missing marketplace category **inline**, in the Generate files preview dialog, only when a new-products file contains a category that has no mapping for that marketplace (`FilePreview.unmappedCategoryIds`, options from `marketplaceCategoryOptions(mp)`, saved with `setCategoryMapping`). Once chosen it is remembered and never asked again.
- The dialog recomputes its preview from live state (`dialogKey` + `useMemo`), so the Generate button unlocks as soon as the last category is picked.
- `CategoryMappingView` and the `category-mapping` route still exist (reachable from Category detail → Marketplaces → Manage), so nothing that links to it breaks.
- Demo: Generate files → Rafeeq → "New products" → Preview changes. It asks for Personal Care and Baby Care.
