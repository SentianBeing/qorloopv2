# Implementation plan — Marketplace Price (demo update, 19 Oct 2026)

Source: client feedback from 15 Oct (`client-feedback-2026-10-15.md`), point 1. This plan was written for the front-end demo and is now implemented in `src/lib/pricing.ts`, `src/types/index.ts`, `MarkupsView`, `CatalogueView`, `BulkPriceModal`, `CompareAgainstToggle` and `PriceSourceChip`. It is kept here as the design rationale; the backend must implement the same behaviour (see `docs/05-business-rules.md`).

## Goal

Replace the per-marketplace "Markup %" concept with a single **Marketplace Price** that the retailer controls. The price reports can then compare marketplaces against either the **ERP price** or the **Marketplace price**, so merchants who deliberately price above or below ERP stop seeing false mismatches.

## Data model and pricing logic

```ts
export type PriceMode = 'percent' | 'amount' | 'fixed' | 'same';
// percent: ERP × (1 + v/100)   amount: ERP + v QAR   fixed: exactly v QAR   same: = ERP

export interface PriceRule { mode: PriceMode; value: number; }
export type PriceSource = 'offer' | 'product' | 'category' | 'marketplace' | 'default';
export type CompareReference = 'erp' | 'marketplace';
```

- A product can have its own `priceRule`, an `offerPrice` (clearance or near-expiry, can be below ERP), and per-marketplace overrides (only used when the advanced per-marketplace option is on).
- Category and subcategory rules apply to every product in that category.
- One default rule for the tenant (e.g. +10%), plus a rounding setting.
- `resolveMarketplacePrice(product, settings, categoryRules, marketplace?)` returns `{ price, source }`.
- `getReferencePrice(product, reference, …)` returns either the ERP price or the resolved Marketplace Price.

## Screens

- **Marketplace Price page:** default rule card (% markup / + QAR / same as ERP, rounding, live example), category and subcategory rules table, product overrides list with source chips, bulk import card (download template → upload → before/after review → apply), and an "Advanced: different price per marketplace" section, off by default, with the warning "Most marketplace contracts require the same price everywhere."
- **Catalogue ("the bible"):** Marketplace price column right after ERP price, with a source chip and the difference vs ERP (green when below ERP). Inline edit popover. Row selection opens a sticky bulk bar → bulk price modal (set % / add or subtract QAR / set exact / set offer / reset to category default) with a before/after preview.
- **Product detail:** Marketplace price and its source in the hero; a "Marketplace price" tab with rule editor, offer price with optional "valid until", and a resolved-price breakdown.
- **Reports:** a shared "Compare against: Marketplace price | ERP price" toggle. Expected price is the same on every marketplace (parity). No editing on reports; the row menu links to "Edit marketplace price".
- **Generate files:** a banner states which price goes into the files; rounding comes from pricing settings (read-only here).

## The demo story

With the toggle on **ERP price**, most of the catalogue shows as mismatched, because everything is marked up. Switching to **Marketplace price** drops that to the handful of real mismatches. That contrast is exactly the problem the client described.

## Questions raised (still open, see docs/08-open-questions.md)

- Naming: "Marketplace Price" or "Selling price"?
- Rule modes: are % markup, + QAR and exact price the full set?
- Offers: auto-expire ("valid until") or manual only?
- Marketplaces: Jahez or Keeta as the fourth?
- Bulk import file: barcode or ERP SKU as the key?
