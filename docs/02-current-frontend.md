# 2. The current front end (what exists today)

The app is a Vite + React 19 + TypeScript + Tailwind 4 single-page app, built from Google AI Studio prompts and then cleaned up. It runs entirely in the browser: **no backend, no real auth, no database.** State lives in React context and `localStorage`. It has been presented to the client offline (run locally); it is not deployed anywhere. The design is **partially approved**.

`npm test` (15 tests) and `npm run build` pass as of 22 Oct 2026.

## Screens built

| View file | Screen (blueprint ID) | Notes |
|---|---|---|
| `LoginView` | Log in (AUTH-004) | Fake: any credentials set a session flag |
| `OnboardingCompleteView` | Onboarding wizard (ONB-001…007) | 4-step wizard + results screen; spec in `reference/onboarding-wizard-spec.md` |
| `DashboardView` | Dashboard (DASH-001) | Source cards with freshness, mismatch tiles, needs attention |
| `UploadModal` | Upload file (UPL-001) | Source, full or partial, drop zone, sample files |
| `UploadReviewView` | Upload detail and review (UPL-002) | Summary tiles, tabs, confirm and apply |
| `ColumnMappingView` + `ColumnMappingPanel` | Column mapping (MAP-001) | Also embedded in onboarding |
| `UploadsHistoryView` | Upload history (UPL-003) | |
| `StockMismatchesView` | Stock discrepancies (RPT-001) | Availability-based |
| `PriceDiscrepanciesView` | Price discrepancies (RPT-002) | With the compare-against toggle |
| `PriceMismatchesView` | (old screen) | Superseded by RPT-002; not in navigation |
| `GenerateFilesView` | Generate file + Generated files (OUT-001/002) | Preview dialog, real .xlsx download |
| `CatalogueView` | All products (CAT-001) | ERP price + Marketplace price columns, bulk bar |
| `ProductDetailView` | Product detail (CAT-002) | |
| `NewProductsView` | New products (CAT-004) | Inline Arabic name and category, activate |
| `AddProductView` | Add product | Outside the approved Phase 1 scope; hidden |
| `MarkupsView` | Marketplace Price (PRC-001) | Renamed from Markups |
| `BulkPriceModal` | Bulk price update (PRC-002 / catalogue bulk) | |
| `CategoryMappingView` | Category mapping (SET-008) | Qorloop category → marketplace category |
| `CategoriesView`, `CategoryDetailView` | Categories | Hidden from navigation in the demo |
| `TemplatesView` | File mappings + upload formats (SET-004/006) | |
| `SettingsView` | Settings | Mostly placeholder |

The full list of 76 blueprint screens, with what's missing, is in [09-screen-inventory.md](09-screen-inventory.md).

## Two data layers (important)

The demo grew in two steps, so it has **two separate mock data sources**. Some screens read one and some read the other:

1. **`src/demo/` (the "demo store")**: a tested, self-contained model of the whole daily loop.
   - `types.ts`: the data model (`DemoState`, `Product`, `Listing`, `UploadRecord`, `InputTemplate`, `OutputTemplate`, …)
   - `recon.ts`: **the single place mismatches are computed** (`reconRow`, `summarize`, `stockMismatches`, `priceMismatches`, `needsAttention`)
   - `uploads.ts`: field lists, layout detection (`detectTemplate`), mapping suggestions, parsing, building the review, applying it
   - `exports.ts`: corrected files in each marketplace's exact columns (`previewFile`, `rowsForFile`)
   - `pricing.ts`: the **old** markup-% model (`expectedPrice`) and `normalizeBarcode`
   - `store.tsx`: `useDemo()` actions plus `localStorage` persistence
   - `__tests__/flow.test.ts`: end-to-end tests
2. **`src/context/AppContext.tsx` + `src/data/*` + `src/lib/pricing.ts`**: UI state (current view, toasts, modals) **plus** a second product list used by the Marketplace Price features (catalogue column, bulk modal, compare toggle, generate files banner). `lib/pricing.ts` is the **new** Marketplace Price engine.

**Consequence for the real build:** there must be **one** source of truth. The backend owns the data. The business logic from `src/demo/{recon,uploads,exports}.ts` and `src/lib/pricing.ts` is merged into one shared package, with the recon using the **new** Marketplace Price engine instead of `expectedPrice(markupPct)`. See [03-architecture.md](03-architecture.md) and Phase 1 task F3.

## What is mock or fake today

- Login and sessions (any password works, no MFA, no invites)
- Tenants (one hard-coded tenant, "Doha Fresh Markets")
- The demo clock (fixed at 06 Oct 2026 09:14 Asia/Qatar)
- Persistence (`localStorage` only)
- File processing (in the browser, so it won't scale to 50k rows or 25 MB files)
- Team, settings, notifications, activity log (static or partial)
- No URLs per tenant, no API, no audit trail, no emails

## Known gaps and UI debt to fix while integrating

- **Routing:** the app switches screens with `currentView` state. Real URLs are needed (`/reports/price`, `/catalogue/:id`) so Back, refresh and deep links work. Use React Router.
- **Design tokens:** colours are hard-coded hex values in class names (e.g. `#0D6D4E`, `#F9FAFB`). The blueprint tokens are in `reference/Qorloop_UIUX_Implementation_Blueprint.pdf` §7: Primary `#0F6E5C`, Background `#F7F7F5`, Inter, 4 px spacing scale, 36 px table rows. Move them to CSS variables and Tailwind theme tokens. This makes dark mode a later, cheap job.
- **State coverage:** the blueprint §6 requires loading (skeleton), empty, error, partial-data, no-access, offline, processing and failed states per screen. The demo mostly shows the happy path.
- **Tables:** 50k-row catalogues need server-side pagination (cursor-based), sorting and filtering, not in-memory arrays.
- **Bundle size:** the build warns about a chunk over 500 kB. Code-split per route, and lazy-load `xlsx`.
- **Leftovers:** remove the `.env.example` Gemini key from AI Studio and the `metadata.json` AI Studio file, and rename the package from `react-example` to `qorloop-web`.
- **Unrouted screens:** `AddProductView`, `CategoriesView`, `CategoryDetailView` and `PriceMismatchesView` are not reachable in `App.tsx`. Leave them out until scope is confirmed. Delete `PriceMismatchesView`, which RPT-002 replaces.
- **`ProductImage`:** it draws brand-like artwork (e.g. Pepsi). Replace it with a neutral placeholder, and with real images once the image decision is made.
