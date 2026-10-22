# 1. Product overview

## The problem

A Qatar supermarket sells the same products in its stores and on 3–4 delivery marketplaces. Its ERP (point of sale and stock system) holds the true price and stock. Each marketplace holds its own copy of the menu, which is updated by uploading Excel files to that marketplace's seller portal. These copies drift:

- **Price drift.** The ERP price changed, but Talabat still shows the old price.
- **Stock drift.** A product is out of stock in the ERP, but Snoonu still lets customers order it (cancelled orders, angry customers). Or it is back in stock, but Rafeeq still shows it as unavailable (lost sales).
- **Missing listings.** New ERP products never reach the marketplaces, and delisted products are still being sold.

Today a catalogue manager compares these files by hand in Excel. Qorloop does the comparison and writes the correction files.

## The core loop (what the product is for)

1. **Upload** the ERP file and each marketplace's export file. After the first time, Qorloop recognises the file layout automatically.
2. **Review** the upload summary (rows read, matched, new, errors, changes) and confirm.
3. **See mismatches** per marketplace: stock (availability) and price.
4. **Generate and download** a corrected file for each marketplace, in that marketplace's own upload format. Then upload it to the marketplace portal (outside Qorloop).

Three supporting jobs sit around the loop:

- keeping the catalogue clean: new products, Arabic names, categories and subcategories
- setting the Marketplace Price
- configuring file mappings once

The daily loop must be **four clicks deep at most** (blueprint UX principle 1).

Each customer gets **its own Qorloop instance on its own subdomain**. There is no public sign-up: we create the instance and invite the customer's Owner.

Phase 1 is **file-based**. There are no marketplace APIs, orders or checkout. Direct marketplace integrations are Phase 2.

## Users and roles

| Role | Who | Can do |
|---|---|---|
| **Tenant Owner** | Retailer owner or GM who signed up | Everything in the tenant, including billing, deleting the tenant and approving support access. MFA is mandatory. |
| **Tenant Admin** | Operations or e-commerce manager | Everything except billing, tenant deletion and managing the Owner |
| **Catalogue Manager** | Daily operator (1–3 per retailer) | Upload files, fix mismatches, activate new products, set prices, generate files. No user or tenant settings. |
| **Analyst** | Finance, category staff or auditors | Read-only. Export only if the Owner allows it. |
| **Platform Super Admin** | Globify or the client, running the platform (in Phase 1: Globify ops, using the provisioning and ops scripts; the admin app comes with the shared SaaS) | Admin app: tenants, plans, admin users, marketplace category trees. Two-person rule for tenant deletion. |
| **Platform Support** | Support agent | Tenant metadata only. Can see tenant data only with a time-boxed grant that the Owner approved. |
| **Platform Billing Admin** | Finance | Plans and invoices |

**Permissions shape the interface** (blueprint UX principle 12): users don't see actions they can't take. The **server enforces every permission**; hiding in the UI is only for usability.

## Market context

- Country: Qatar. Currency: QAR, 2 decimals. Time zone: Asia/Qatar (UTC+3). Timestamps are always shown with the time zone.
- Marketplaces: **Talabat, Snoonu, Rafeeq, Keeta** in the demo. The client also mentioned **Jahez**; which four ship is an open question.
- Product data is bilingual (an Arabic name per product), but the UI is **English only**. Arabic text renders right-to-left in place (`dir="auto"`, IBM Plex Sans Arabic).
- Tenants hold 5k–50k products each. Tables must stay fast at 50k rows.

## Client decisions so far

Source: `reference/client-feedback-2026-10-15.md`.

1. **Marketplace Price** replaces "markup". It is one price that the retailer sets for all marketplaces, because aggregator contracts require price parity.
   - It can be a % markup, + or − a QAR amount, a fixed price, the same as ERP, or a temporary offer below ERP.
   - A different price per marketplace is an **advanced** option, off by default.
2. **Bulk price updates are essential:** by category, by product, inline in the catalogue, and by file (10k rows).
3. **Reports have a "compare against" toggle:** Marketplace price (default) or ERP price. Reports are read-only.
4. **Generated price files use the selected reference price.**
5. **Categories plus subcategories.**
   - At onboarding, our team cleans and maps the first 5–10k products.
   - After onboarding, merchants pick a category and subcategory for each new product.
   - Marketplaces use categories only in new-product files.
6. **Stock is compared as availability** (available / unavailable), not quantity, because marketplace files only carry True/False.
7. **Marketplaces are shown as neutral text labels**, not logos. Use the blueprint's brand colours for now.
8. **Dark mode is not a priority**, but colours and fonts must be built as design tokens from day one.
9. **Not in Phase 1:**
   - reports and analytics beyond the mismatch reports
   - the Qatar security and compliance add-on (data breach monitoring etc.), which is a later phase under a separate proposal
   - marketplace APIs

## Glossary

| Term | Meaning |
|---|---|
| Tenant | One retailer business (can have several stores or branches later) |
| ERP file | The retailer's product export: barcode, name, selling price, cost, stock, active, category |
| Marketplace file | A marketplace's menu export: its product ID, barcode(s), price, availability |
| File mapping (code: `inputTemplate`) | How Qorloop reads a given file layout: Qorloop field → column header. Saved after the first upload and versioned. Users never see the word "template". |
| Upload format (code: `outputTemplate`) | The exact column layout a marketplace accepts for bulk upload. Built into the product, the same for every retailer. |
| Marketplace Price | The price the retailer wants on marketplaces, resolved from rules (see business rules) |
| Reference price | What marketplace prices are compared against: ERP price or Marketplace Price (toggle) |
| Mismatch | A marketplace listing whose price or availability differs from what it should be |
| Not listed | An active ERP product that a marketplace doesn't have |
| Missing from ERP | A product that was not in the latest full ERP file but is still listed on a marketplace |
| Recon | Reconciliation: computing all product × marketplace rows and their status |
| Stale | A source whose latest file is older than the stale window (default 12 h) |
| Shelf-managed / Qorloop-managed fields | Fields curated in Qorloop (Arabic name, category, subcategory, image, price rules, status) that an ERP upload never overwrites |
