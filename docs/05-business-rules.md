# 5. Business rules

These rules are already implemented and tested in the demo. Port them into `packages/core`, keep the tests, and add more. The code references are there so you can read the exact behaviour.

## 5.1 Marketplace Price (`src/lib/pricing.ts`)

A product's Marketplace Price comes from the **first rule that applies**:

1. **Offer price** (temporary, can be below ERP; e.g. near-expiry Laban ERP 1.75 → offer 1.25). Used exactly as typed.
2. **Product rule** (this product only)
3. **Category / subcategory rule** (e.g. Fruits & Vegetables +1.00 QAR). The subcategory rule should win over the category rule. *The demo only matches on category; add the subcategory step.*
4. **Per-marketplace rule.** Only when the advanced "different price per marketplace" option is on. Off by default, because of price-parity contracts.
5. **Default rule** for the tenant (e.g. +10%)

> ⚠️ **Confirm the order** (Q9). The demo code puts the per-marketplace rule at step 4. The 19 Oct design note put it above the product rule. Build it as above, keep the order in one function, and change it there if the client decides otherwise.

**Rule modes:**

| Mode | Result |
|---|---|
| `percent` | ERP × (1 + v/100) |
| `amount` | ERP + v (v can be negative) |
| `fixed` | exactly v |
| `same` | = ERP |

**Rounding:** applies only to **calculated** prices (`percent` and `amount`). `fixed`, `same` and offers are used exactly as entered. Avoid float noise by computing with integer fils (QAR × 1000) or a decimal library. Don't use raw JS floats: the demo shows that 5.5 × 1.15 = 6.3249999.

The result is `{ price, source }`, where source is `offer | product | category | marketplace | default`. The UI shows the source as a chip.

**Bulk changes** (BulkPriceModal):

- set % markup
- add or subtract QAR
- set exact price
- set offer price
- reset to the category default

These apply to a selection, or to "all n in this category". There is always a before/after preview first.

**Bulk price file:** download a template (Barcode, Name, ERP price, Current marketplace price, New marketplace price), upload it, review per row (changed, unchanged, errors), then apply the valid rows. The key is barcode unless the client decides SKU (Q6).

## 5.2 Reference price and the compare-against toggle

- `reference = 'marketplace'` (default): expected price = the resolved Marketplace Price.
- `reference = 'erp'`: expected price = the ERP selling price.
- The same reference is used in the reports **and** in generated price files. The Generate files banner says which one is in use.
- With parity on (the default), the expected price is **the same on every marketplace**.

## 5.3 Availability (stock) (`src/demo/recon.ts → erpAvailable`)

A product **should be available** on marketplaces when **all** of these are true:

- status is `active` in Qorloop
- `erp_active` is true
- it was in the latest full ERP file
- `erp_stock > stock_threshold` (default 0)

Marketplaces only report **available True/False**. Never compare quantities, and never show "marketplace stock 80, difference −40".

| ERP says | Marketplace says | Stock issue | Severity |
|---|---|---|---|
| available | unavailable | `unavailable_but_in_stock` | Lost sales (amber) |
| not available | available | `available_but_out_of_stock` | Urgent: customers can order stock that doesn't exist (red, sorted first) |

A marketplace file may give a quantity instead of a flag. Treat quantity > 0 as available. True/False, Yes/No, 1/0 and quantities are all accepted.

## 5.4 Reconciliation status per product × marketplace (`reconRow`)

Evaluate in this order:

1. The marketplace has **no file uploaded yet** → `no_data`. Show "No data" and "Upload a Keeta file to compare", never zeros.
2. Product status is `new` (not yet activated) → `new`
3. No listing on this marketplace:
   - if the product is active, in the latest ERP file and ERP-active → `not_listed`
   - otherwise → `in_sync`
4. The product is **not in the latest full ERP file** but is still listed → `missing_from_erp`. If it is still available there, flag `available_but_out_of_stock`.
5. Otherwise:
   - **price mismatch** when |actual − expected| > `price_tolerance` (default 0.00 QAR)
   - **stock issue** as in 5.3
   - either one → `mismatch`; neither → `in_sync`

**Counts:** per marketplace, `total = stock + price` (a product with both issues counts once in each). The dashboard, report tabs, filter counts and Generate files **must all read the same summary**. Never type a count.

**Freshness:** a source is **stale** when its latest upload is older than `stale_hours` (default 12). Show it with an amber dot and note ("Talabat data is 15 hours old"). Green means under 24 h in the source chip (blueprint §7).

## 5.5 Matching marketplace rows to products

- **Barcode normalisation** (`normalizeBarcode`): trim, strip a trailing `.0` (Excel numbers), strip leading zeros. Talabat pads barcodes to 14 digits (GTIN-14), which then equals the 13-digit EAN.
- Match on any of the row's barcodes (Talabat has `barcode 1..3`). *New for the real build:* fall back to SKU when no barcode matches.
- No match → **unmatched row** (stored with `product_id = null`, shown in the review's "Unmatched rows" tab and later in Data quality CAT-005, where the user can link it in CAT-006).
- Two products matching the same row is an error. Report it and don't guess.

## 5.6 Uploads

- **Source** is chosen by the user (ERP or a marketplace). The modal preselects it from the card the user clicked.
- **Full or partial:**
  - **Full** means the file is the complete list. Products missing from it are flagged ("missing from file"). For ERP, `in_latest_erp_file = false`. For a marketplace, the listing is removed.
  - **Partial** only updates the rows it contains.
- **Layout detection:** a saved file mapping matches when **all** its signature headers are present (case- and space-insensitive). If nothing matches, the user maps columns (MAP-001) and the mapping is saved as a new mapping for that source.
- **Wrong-file guard:** before mapping an unrecognised file, check it against the other sources' mappings. If it matches another source, block it: "This looks like a Snoonu file, not a Rafeeq file."
- **Fields:**
  - ERP: barcode*, name (EN)*, name (AR), selling price*, cost, stock*, active, category, brand
  - Marketplace: marketplace product ID*, barcode*, barcode 2, barcode 3, name, price*, availability (or quantity)*
  - (* = required)
- **Row validation:** a missing required value, a non-numeric price or stock, or unreadable availability is a row error (row, column, value, reason). Invalid rows are skipped. The upload is rejected if more than 20% of rows are invalid.
- **Review summary:**
  - rows read, matched, new products, rows with errors, price changes, stock / availability changes, missing from file
  - tabs: Price changes / Stock (or Availability) changes / New products / Missing / Errors / Unmatched
- **First ERP import** (no previous ERP upload for the tenant): all products become `active`. Later ERP files create products with status `new`, which must be completed and activated (CAT-004).
- **ERP never overwrites Qorloop-managed fields** (see the data model). The Arabic name is taken from the ERP only when Qorloop's is empty.
- A category is guessed from the ERP category text when possible, and the user can correct it.
- "Confirm and apply" writes everything in one go, logs activity per changed field, refreshes recon, and **returns the user to the Dashboard**.

## 5.7 New products

- A product is "ready" when it has an Arabic name and a category (plus a subcategory, if the client confirms subcategories as required).
- "Activate selected" activates the ready rows and reports the rest as skipped, with the reason.
- An activated product appears as `not_listed` on each marketplace and goes into that marketplace's **new-products file**.

## 5.8 Generated files (`src/demo/exports.ts`)

- **Kinds:** `stock`, `price`, `stock_price` (update), `new_products`. **Scope:** `mismatches` only, or `all` listed products.
- **Rows:**
  - `new_products`: rows with status `not_listed`
  - otherwise: listed rows (excluding `missing_from_erp`), filtered by mismatch type unless scope is `all`
- **Values written:** price = the expected price for the chosen reference, formatted with 2 decimals. Availability = `erpAvailable`. The ID is the marketplace's product ID (or the barcode for new products).
- **Blocked when:**
  - the marketplace has no upload format ("Keeta upload format is missing"), or
  - it's a new-products file and some categories have no marketplace category mapping. The message names how many categories and products.
- **Preview first:**
  - product count, price changes, availability changes
  - largest price change ("Nescafe Classic 200g 17.50 → 19.80")
  - the first 10 rows in the marketplace's own columns
  - Generate is enabled only after the preview has been seen.
- **File name:** `{Marketplace}_{Stock|Price|Update|NewProducts}_{DDMonYYYY}_{HHmm}.xlsx`, in Asia/Qatar time.
- **History:** files are kept 30 days and can be downloaded again.
- **Upload formats (built in):**

| Marketplace | Columns |
|---|---|
| Talabat | sku, name, price, active, maximumSalesQuantity, isWeighted, baseWeight, baseWeightUnit, pricePerBaseUnit, barcode 1 (14-digit zero-padded), barcode 2, barcode 3, category 1 (new products only) |
| Snoonu | Barcode(UniqueIdentifier), Product Name (En)(ReadOnly), SKU(ReadOnly), Barcode(ReadOnly), Price(Update), Availability(Update) True/False, Images(Custom) |
| Rafeeq | Item ID, EAN, Item Name, Selling Price, In Stock (Yes/No) |
| Keeta | not configured, so comparison only |

The Talabat and Snoonu columns come from the client's real sample templates. **The Rafeeq columns are a placeholder**, and Keeta/Jahez are unknown. Confirm all of them against real marketplace files (Q10) before testing.

## 5.9 Status vocabulary (use exactly these words everywhere)

In sync · Mismatch · Not listed · Processing · Needs mapping · Needs review · Applied · Rejected · Failed · Candidate · Active · Inactive

Status is never shown by colour alone: every pill has a word and an icon.

## 5.10 Wording rules

- Never show "template" to users. Say "File mapping" for how Qorloop reads a file, and "upload format" for the layout a marketplace accepts.
- Write "Marketplace price" (pending Q4) and "ERP price".
- Money: 2 decimals, with "QAR" in the column header rather than in each cell.
- Times: "today 09:12", "yesterday 18:40", always in Asia/Qatar time.
