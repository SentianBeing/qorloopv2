# 4. Data model

This is the starting schema for Postgres. It is based on `src/demo/types.ts` and `src/types/index.ts`, extended for multi-tenancy, auth and Marketplace Price. Column lists are indicative; the developer refines them in the migration PRs.

Conventions:

- `id uuid` primary keys
- `created_at` / `updated_at timestamptz`
- money as `numeric(12,3)` (QAR is shown with 2 decimals, but some marketplaces use 3)
- every customer-owned table has `tenant_id`, which is part of its unique keys
- **Phase 1 runs one tenant per instance** (one database per customer), but the schema is the shared-SaaS schema from day one. See `03-architecture.md` → "Deployment model".

## Ownership rule (most important)

| Owned by the **ERP file** (overwritten on every ERP upload) | Owned by **Qorloop** (never overwritten by an upload) |
|---|---|
| barcode, sku, name_en, brand, size, erp_category (raw text), erp_price, cost_price, erp_stock, erp_active, in_latest_erp_file | name_ar (unless empty and the ERP supplies one), category_id, subcategory_id, image, status (active / inactive / new), price rules, offers |

The UI labels these fields "From ERP" and "Managed in Qorloop" (blueprint UX principle 7).

## Entities

### Identity and tenancy
- **users**: email (unique), name, phone, password hash / auth fields, email_verified_at, mfa_enabled. Managed by the auth library.
- **sessions**, **verification tokens**, **two_factor** (TOTP secret, recovery codes): managed by the auth library.
- **tenants**: name, subdomain, country (QA), currency (QAR), timezone (Asia/Qatar), erp_name, status (active / suspended), onboarding_step, onboarding_completed_at. There is exactly one row per instance in Phase 1. Leave `plan` for the SaaS phase.
- **memberships**: user_id, tenant_id, role (`owner` | `admin` | `catalogue_manager` | `analyst`), status (`active` | `invited`). Unique (user, tenant).
- **invitations**: tenant_id, email, role, token hash, invited_by, expires_at, accepted_at.
- **stores**: tenant_id, name (one per tenant in Phase 1; multi-branch later).
- **tenant_settings**:
  - price_tolerance (QAR, default 0)
  - stock_threshold (available when erp_stock > threshold, default 0)
  - stale_hours (default 12)
  - mfa_required_for_all
  - analyst_can_export

### Marketplaces
- **marketplaces** (global reference table): id (`talabat`, `snoonu`, `rafeeq`, `keeta`), name.
- **tenant_marketplaces**: tenant_id, marketplace_id, enabled.

### Catalogue
- **products**: tenant_id, barcode, sku, then the ERP-owned fields above, then the Qorloop-owned fields above, updated_by. Unique (tenant_id, normalized_barcode).
- **categories**: tenant_id, parent_id (null = category; set = subcategory), name_en, name_ar, sort. Whether the list is fixed or tenant-defined is open question Q1. The model supports both if a global "starter list" is copied into each tenant at onboarding.
- **category_mappings**: tenant_id, category_id, marketplace_id, marketplace_category (text in Phase 1; a reference to the platform's marketplace category tree later, ADM-005).

### Marketplace data
- **listings**: what the latest marketplace file says about one product.
  - Fields: tenant_id, product_id (nullable until matched), marketplace_id, marketplace_product_id, barcodes text[], name, price, available, upload_id.
  - Unique (tenant, marketplace, marketplace_product_id).
  - Unmatched rows have `product_id = null`; they feed Data quality (CAT-005/006).

### Pricing (Marketplace Price)
- **pricing_settings** (one per tenant):
  - default_rule_mode (`percent` | `amount` | `fixed` | `same`), default_rule_value
  - rounding (`exact` | `0.05` | `0.25` | `0.50`). See open question Q13: the demo has two rounding schemes.
  - per_marketplace_enabled (advanced, default false)
  - compare_reference_default (`marketplace`)
- **category_price_rules**: tenant_id, category_id, subcategory_id (nullable), mode, value.
- **product_price_rules**: tenant_id, product_id, mode, value.
- **product_offers**: tenant_id, product_id, price, valid_from, valid_until (nullable; Q5).
- **marketplace_price_rules** (advanced only): tenant_id, marketplace_id, product_id (nullable = marketplace-wide), mode, value, rounding.

### Uploads and mappings
- **input_templates** ("file mappings"):
  - Fields: tenant_id (null = built-in), source (`erp` or marketplace id), name, version, fields jsonb (Qorloop field → header), signature text[] (headers that identify the layout).
  - A new version is created on every edit; old uploads keep pointing to the version they used.
- **uploads**:
  - Fields: tenant_id, source, file_name, size, storage_key, contains (`full` | `partial`), template_id, uploaded_by, status (`uploading` | `processing` | `needs_mapping` | `needs_review` | `applying` | `applied` | `rejected` | `failed` | `discarded`), step, progress, summary jsonb, error_message, applied_at.
  - The summary counts are: rows_read, matched, new_products, rows_with_errors, price_changes, stock_changes, missing_from_file.
- **upload_rows** (staging area for the review): upload_id, row_number, parsed jsonb, match_product_id, change_type. Delete these after apply or discard, keeping the summary.
- **upload_errors**: upload_id, row, column, value, reason.

### Recon and outputs
- **recon_rows** (materialised, recomputed by the worker):
  - keys: tenant_id, product_id, marketplace_id
  - prices: marketplace_price, marketplace_price_source, erp_price, actual_price
  - availability: erp_available, actual_available
  - flags: price_mismatch_vs_erp, price_mismatch_vs_marketplace, stock_issue (`unavailable_but_in_stock` | `available_but_out_of_stock` | null)
  - status: `in_sync` | `mismatch` | `not_listed` | `missing_from_erp` | `new` | `no_data`
  - last_updated
- **recon_summary**: per tenant × marketplace: listed, stock, price (for each reference), total, has_data, last_upload_at, stale.
- **output_templates** ("upload formats", built in): marketplace_id, name, version, columns text[], configured.
- **generated_files**: tenant_id, marketplace_id, kind (`stock` | `price` | `stock_price` | `new_products`), scope (`mismatches` | `all`), reference (`erp` | `marketplace`), file_name, storage_key, product_count, generated_by, generated_at, expires_at (30 days).

### Audit and notifications
- **activity_log**: tenant_id, at, actor_user_id, action, entity_type, entity_id, field, old_value, new_value, source (`ERP file` | `Talabat file` | `Manual` …), request_id. It feeds product history (CAT-002) and ACT-001.
- **notifications**: tenant_id, user_id, type, payload, read_at (NOT-001, P1).

### Platform (only when Qorloop becomes a shared SaaS)
- **platform_admins**, **support_grants** (tenant, requested_by, approved_by, scope, expires_at), **platform_audit_log**, **plans**, **marketplace_category_trees**.

## Indexes to have from day one

- `products (tenant_id, normalized_barcode)` unique
- `products (tenant_id, sku)`
- `products (tenant_id, status)`
- trigram index on `products.name_en` for search
- `listings (tenant_id, marketplace_id, product_id)`
- `recon_rows (tenant_id, marketplace_id, status)`
- `uploads (tenant_id, created_at desc)`
