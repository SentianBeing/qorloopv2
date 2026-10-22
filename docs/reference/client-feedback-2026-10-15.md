# Qorloop demo — client feedback (15 Oct 2026)

Participants: Job, Sam, Amal, Karthik (demo driven by Karthik). Market context: Qatar retailers selling on Talabat, Snoonu, Rafeeq, Jahez (prices in riyals).

## 1. Pricing: "Markup" becomes "Marketplace Price"

**Problem raised:** the Price Discrepancy report compares marketplace prices against the ERP price. Merchants who deliberately sell above ERP (flat %, or different markups per category or product) would see every product flagged, which makes the report useless for them.

**Decisions**
- **Rename the concept to "Marketplace Price".** It is whatever price the retailer decides to sell at on marketplaces. It can be above ERP (markup) or below it (clearance or near-expiry offers, e.g. bananas from 50 down to 20).
- **Support a fixed price as well as a %.** Today markup is %-only; the merchant must also be able to type the exact price. No markup = 0% or the same price as ERP.
- **Default to one price across all marketplaces.** Aggregator contracts require price parity (Snoonu will complain if Talabat is cheaper), and there is a ministry-level risk. This applies to loose and single items too.
- **Keep per-marketplace override as an "advanced" option.** It is the current build. Only about 1–2% of merchants would use it.
- **Bulk update is essential:**
  - by category and by product
  - inline in the Catalogue listing
  - bulk file upload (e.g. 10,000 products in one shot)
  - Use case: fruit and veg ERP prices change weekly, and the merchant needs to shift many marketplace prices at once.
- **Catalogue listing:** add a Marketplace Price column right next to ERP Price. Job called it "the bible".
- **Price Discrepancy / Mismatch report:** add a toggle (checkbox or tabs) to compare marketplaces against **ERP price** or **Marketplace price**.
  - No editing on the report. Changes are made in Markup / Marketplace Price.
- **Generated price files** follow the selected reference (ERP or Marketplace price).

## 2. Catalogue and categories

- **Add subcategory** alongside category. Retailer ERPs are badly categorised (e.g. Pepsi under "Drinks" or "Snacks"), and clean categories matter for the files sent to aggregators and for future analytics.
- **Onboarding:** our team cleans and maps categories manually for the initial 5–10k products, so the wrong ERP categories aren't carried forward.
- **After onboarding:** the merchant assigns category and subcategory to new products by picking from our list (New Products / Add Product flow).
- **Marketplace usage:**
  - Marketplaces read category and subcategory when adding new products or doing a menu cleanup.
  - Stock & price update templates ignore categories.
  - Merchants need a periodic (monthly or quarterly) category update option.
- **Phase 2 (direct integration):** map merchant categories to each aggregator's taxonomy (merchant "Snacks" → Talabat "Beverages"). AI-assisted mapping later; it needs sample training data first.
- **Images:** not fetched today, only the Excel columns. Sam asked; no decision yet.

**Open questions**
- Is the category/subcategory list fixed, or can merchants add their own? Job leans towards retailer-defined categories that are mapped to each marketplace.
- How should marketplace category detection work? Job will propose an approach.
- Job wants a dedicated ~30-minute scenario-by-scenario session on the catalogue flow.

## 3. Theme

- Dark/light mode is **not a priority** for the client, which cares about the core problem first.
- Karthik will share a sample so they can judge.
- Structure colour and font tokens properly now either way, because retrofitting later is costly.

## 4. Other

- Settings screen is empty. Not discussed further.
- "Import from ERP" builds the product master at onboarding (from the ERP Excel export).

## Screens affected

| Screen | Change |
|---|---|
| MarkupsView | Rename to Marketplace Price; % or fixed price; default single price across marketplaces; per-marketplace override as advanced; bulk by category/product; bulk file upload |
| CatalogueView | Marketplace Price column next to ERP Price; inline bulk edit; subcategory column |
| PriceDiscrepanciesView / PriceMismatchesView | Compare-against toggle (ERP vs Marketplace price); read-only |
| GenerateFilesView | Use the selected reference price |
| CategoriesView / CategoryMappingView | Category + subcategory hierarchy; onboarding clean-up mapping |
| AddProductView / UploadReviewView (new products) | Category + subcategory pickers |
| Theme | Dark-mode sample; design tokens |
