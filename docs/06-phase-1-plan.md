# 6. Phase 1 plan: kickoff to testing (22 Oct → 20 Nov 2026)

**Goal for Friday 20 Nov 2026:** the core product runs on **staging** with real accounts, a real database and real files, ready for testing. Staging is the first customer instance, created with the provisioning script on its own subdomain. A retailer can do all of this end to end, on data we can trust:

1. accept their invitation and set up MFA
2. set up their store
3. upload their ERP and marketplace files
4. see the true stock and price mismatches
5. set their Marketplace Price
6. download corrected files for each marketplace

**Deployment model:** each customer gets its own instance on its own subdomain. Underneath, the code is tenant-ready, so Qorloop can become a shared SaaS later without a rewrite. The rules are in `03-architecture.md` → "Deployment model". They are internal and don't show up anywhere in the product.

This is **about 4 weeks for one developer**, so it is tight. It is possible because the business logic already exists in TypeScript (see `02-current-frontend.md`). The plan is ordered so that the riskiest parts (auth, file processing, recon) are done first. If time runs short, use the **cut list** at the bottom. Do not slip the date.

**Design status:** the client has approved the design partially. Build the flows on the current screens. Visual changes on screens that aren't approved yet are expected later, but the flows and data won't change. Globify will send the list of approved and pending screens separately.

Task IDs (F, A, U, C, P, R, G, O, S, Q, D) are used in commits and the daily update.

---

## Week 1: Foundation and auth (Thu 22 Oct – Sat 31 Oct)

**Foundation**
- [ ] **F1** Tag the current `main` as `demo-v1`, so the offline client demo can always be run locally from that tag. It is not deployed anywhere, so there's no live demo to keep running.
- [ ] **F2** Write decision notes in `docs/decisions/` by **Mon 26 Oct**:
  - API framework (NestJS or Fastify)
  - ORM (Prisma or Drizzle)
  - auth (Better Auth or a managed provider)
  - staging host and the provisioning tool (Terraform, Pulumi or a script)
  - job queue
  - email provider
- [ ] **F3** Restructure into a monorepo: `apps/web` (move the current app; it must still build), `apps/api`, `apps/worker`, `packages/core`, `packages/db`, `packages/shared`.
- [ ] **F4** Move the business logic into `packages/core`:
  - `src/demo/{recon,uploads,exports,format}.ts`, the `normalizeBarcode` helper and `src/lib/pricing.ts`
  - **merge the pricing models**, so recon uses the Marketplace Price engine instead of markup %
  - money-safe arithmetic
  - keep and extend the tests (`npm test` green)
- [ ] **F5** Postgres schema v1 from `04-data-model.md`, following the tenant-ready rules:
  - UUID keys, `tenant_id` on every customer table and in unique keys
  - a tenant resolver (from `TENANT_ID` config now, from the subdomain later)
  - one data-access layer that always scopes by tenant
  - migrations
  - RLS policies written but optional
  - a seed script that ports `src/demo/seed.ts`
- [ ] **F6** Engineering setup:
  - CI: lint, typecheck and test on every PR
  - automatic deploy of `main` to **staging**, with managed Postgres, Redis and object storage
  - Sentry and structured logs
  - env config with no secrets in git
- [ ] **F7** Web plumbing:
  - React Router with real URLs
  - a typed API client plus TanStack Query
  - blueprint colour, type and spacing as **design tokens** (CSS variables and the Tailwind theme)
  - remove the AI Studio leftovers

**Auth and accounts** (use the chosen library; never hand-roll crypto)
- [ ] **A1** First Owner by invitation. There's no public sign-up in Phase 1. Provisioning (F8) creates the tenant and sends the Owner an invitation, and the Owner accepts it (AUTH-008), which verifies their email.
- [ ] **A2** Log in (AUTH-004), log out, forgot and reset password (AUTH-006/007), idle and absolute session timeout, session-expired page (SYS-005).
- [ ] **A3** TOTP two-step verification (AUTH-005, ACC-002/003): setup with QR code, verify, recovery codes. **Mandatory for Owners.**
- [ ] **A4** Team (SET-009/010) and accept invitation (AUTH-008):
  - invite by email and role
  - accept, setting name and password
  - change role
  - remove a member
  - an Admin can't grant Owner
- [ ] **A5** Roles:
  - one permission map in `packages/shared`
  - a server-side guard on every endpoint
  - the web app hides what the role can't do (blueprint UX principle 12)
  - the Analyst is read-only
- [ ] **A6** Tenant-safety test harness: a test helper that puts **two tenants in one database** and asserts no cross-tenant read or write. Use it in every endpoint test from now on. Production runs one tenant per instance, but this proves the code is ready for the shared SaaS.
- [ ] **F8** Provisioning script, first version (`infra/`): one command creates a customer instance with its subdomain, TLS, database, bucket, secrets, deploy, migrations, tenant row and an Owner invitation. Use it to create **staging**.

**Exit, Fri 30 Oct (staging demo):** staging created by the provisioning script on its own subdomain → accept the Owner invitation → set up MFA → invite a second user with the Catalogue Manager role → log in as them → see only what that role allows.

---

## Week 2: Uploads and catalogue (Mon 2 Nov – Sat 7 Nov)

- [ ] **U1** Upload API (UPL-001):
  - request a signed upload URL, then the file goes to storage
  - create the `uploads` row and enqueue `process-upload`
  - expose status, step and progress for polling
- [ ] **U2** Worker processing:
  - scan and safety checks (type, 25 MB, no macros or encryption)
  - parse .xlsx, .xls and .csv
  - detect the layout from saved mappings
  - validate rows and store row errors
  - reject the file when more than 20% of rows are invalid
- [ ] **U3** Column mapping (MAP-001):
  - mapping suggestions
  - save a versioned file mapping
  - the wrong-file guard ("This looks like a Snoonu file")
- [ ] **U4** Review and apply (UPL-002):
  - build the review: summary counts and all tabs
  - **Confirm and apply** in one idempotent transaction, with ownership rules respected
  - activity log entries per changed field
  - discard
  - first-ERP-import rule (all products active)
- [ ] **U5** Upload history (UPL-003) and row errors with an .xlsx download (UPL-004).
- [ ] **C1** Products API (CAT-001/002):
  - list with cursor pagination, search (name, barcode, SKU) and filters
  - tabs: All, Active, Inactive, New, Missing from ERP
  - detail
  - edit Qorloop-managed fields (Arabic name, category, subcategory, status)
- [ ] **C2** Categories and subcategories:
  - a starter list, pending decision Q1
  - assign a category from the ERP category text
- [ ] **C3** New products (CAT-004): list, inline edit (Arabic name, category), activate selected with reasons for skipped rows.
- [ ] **W2** Connect these screens to the API:
  - upload modal, mapping, review, history
  - catalogue, product detail, new products
  - loading, empty and error states on each

**Exit, Fri 6 Nov:** upload a **real** ERP file (10k+ rows) and real marketplace files on staging → map columns the first time → review → apply → see them in the catalogue. The second upload of the same layout is recognised automatically.

---

## Week 3: Pricing, recon, reports and files (Mon 9 Nov – Sat 14 Nov)

- [ ] **P1** Marketplace Price API (PRC-001):
  - pricing settings and default rule
  - category and subcategory rules, product rules, offers
  - the advanced per-marketplace option (off by default)
  - the resolved price and its source on every product
- [ ] **P2** Bulk price changes:
  - selection and "all in category" with a preview, then apply
  - the catalogue Marketplace price column with inline edit
  - BulkPriceModal connected to the API
- [ ] **P3** *(stretch)* Bulk price file (PRC-002): download template → upload → per-row review → apply valid rows.
- [ ] **R1** Recon worker:
  - recompute `recon_rows` and `recon_summary` for the tenant after every applied upload and pricing change
  - store mismatch flags for **both** references (ERP and Marketplace Price)
  - must be correct at 50k products
- [ ] **R2** Dashboard API and screen (DASH-001):
  - source cards with freshness and stale warnings
  - mismatch tiles (total = stock + price)
  - needs attention
  - "No file yet" for marketplaces without data
- [ ] **R3** Reports (RPT-001 stock, RPT-002 price):
  - server-side filters and pagination
  - the compare-against toggle
  - counts identical to the dashboard
  - row click opens the product
  - read-only
- [ ] **G1** Generate files (OUT-001/002):
  - preview (count, changes, largest change, first 10 rows)
  - generate as a job, then download from a signed URL
  - 30-day history and re-download
  - Talabat, Snoonu and Rafeeq formats
  - blocked reasons
  - spreadsheet formula-injection escaping
  - the file uses the selected reference price
- [ ] **G2** Category mapping (SET-008, manual in Phase 1): Qorloop category × marketplace → marketplace category. Needed for new-product files.

**Exit, Fri 13 Nov:** the **whole daily loop on staging with real files**. The numbers on the dashboard, reports, product detail and generated files all agree. Switching the compare toggle changes the counts as expected.

---

## Week 4: Onboarding, settings, hardening → testing (Mon 16 Nov – Fri 20 Nov)

- [ ] **O1** Onboarding wizard on the API (ONB-001…007, spec in `reference/onboarding-wizard-spec.md`): Your store → Marketplaces → ERP file (required) → Marketplace files (can skip) → "Your first check" results. It resumes at the saved step.
- [ ] **S1** Settings:
  - General and rules (SET-001): price tolerance, stock threshold, stale window
  - Marketplaces on/off (SET-003)
  - Upload formats, read-only (SET-006)
  - Security: require MFA for all, Analyst export allowed (SET-012 basic)
- [ ] **S2** Activity: product history tab (CAT-002) plus a basic activity log list (ACT-001).
- [ ] **S3**
  - Re-auth dialog before sensitive actions (AUTH-010): role changes, MFA off, security settings.
  - System pages 404, 403, 500 with request ID (SYS-001/002/003).
  - An offline banner.
- [ ] **Q1** Tests:
  - unit tests for `packages/core`
  - API integration tests for the daily loop
  - tenant safety (two tenants in one DB) on every endpoint group
  - **a Playwright smoke test** of accept invitation → onboarding → upload → review → report → generate
- [ ] **Q2** Performance check:
  - a 50k-row ERP file is processed and applied in **under 3 minutes**
  - catalogue and report pages respond in **under 1 s** at 50k products
- [ ] **Q3** Security pass:
  - rate limits on auth endpoints, security headers, cookie flags
  - `npm audit`, no secrets in the repo
  - buckets private
  - backups on and a restore tested once
- [ ] **F9** Provisioning, final version:
  - create a **second** instance from scratch with one command, to prove it works
  - a release job that deploys and migrates every instance
  - an instance list with version, health and last backup (ops script)
- [ ] **D1** **Wed 18 Nov: feature freeze.** Only fixes after this.
- [ ] **D2** **Thu 19 Nov:** final staging deploy:
  - a seeded test tenant
  - one account per role
  - client sample files loaded
- [ ] **D3** **Fri 20 Nov: hand over for testing.**
  - staging URL
  - test accounts
  - a test checklist (the steps in "Definition of done" below)
  - a known-issues list
  - a short "how to test" note

---

## Definition of done for 20 Nov ("testing stage")

On staging, with real files from the client:

1. We can create a new customer instance on its own subdomain with one command. The Owner accepts the invitation, sets up MFA, completes onboarding and invites a team member.
2. Each of the four roles sees and can do only what the blueprint allows. The server rejects everything else.
3. ERP and marketplace files (up to 25 MB / 50k rows) upload, are recognised or mapped once, show a correct review, and apply.
4. The dashboard, stock report, price report and product detail show the **same** numbers. Stock is compared as availability.
5. Marketplace Price rules work:
   - default, category, product and offer rules
   - bulk changes across a selection or category
   - the compare-against toggle
6. Corrected files for Talabat, Snoonu and Rafeeq download in the exact marketplace format, after a preview.
7. Each customer's data lives only in its own instance. Automated tests also prove the code is tenant-safe with two tenants in one database, ready for the future SaaS.
8. CI is green, errors reach Sentry, backups run.

## Inputs needed from Globify and the client (with dates)

| By | What | Why |
|---|---|---|
| **Mon 26 Oct** | Real sample files: ERP exports from 2–3 retailers, plus each marketplace's **export** and **bulk upload format** | Parsing, matching and output formats are built from them |
| **Mon 26 Oct** | Hosting region and data residency (Q8), the main domain for customer subdomains, and the email sending domain (Q11) | Staging, production, subdomains and invitation emails |
| **Mon 2 Nov** | Category list: fixed or merchant-defined? Subcategory required? (Q1) Keeta or Jahez? (Q3) | Schema and seed data, onboarding |
| **Mon 9 Nov** | Pricing order (Q9), offer expiry (Q5), bulk file key (Q6), rounding options (Q13) | Pricing engine |
| Ongoing | Which screens are design-approved | Avoid reworking visuals twice |

If an answer is late, build on the default in `08-open-questions.md` and keep going.

## Cut list (if behind, cut in this order; never cut the last group)

1. Bulk price **file** import (P3). Bulk changes from the UI stay.
2. "Download report" export on the reports.
3. Advanced per-marketplace pricing **UI**. Keep the data model.
4. Activity log list page. Keep logging the events.
5. Offline banner, polish of the onboarding results screen.
6. Keeta and any fourth marketplace without a confirmed format (comparison only, or hidden).

**Never cut:**

- auth with MFA
- roles enforced on the server
- the tenant-ready data layer (tenant_id, UUIDs, scoped data access)
- the provisioning script
- upload → review → apply
- correct recon
- preview before generating files

## Rhythm

- **Daily** (end of day): a short written update covering done / next / blocked, with task IDs.
- **Fri 30 Oct, Fri 6 Nov, Fri 13 Nov:** a 30-minute staging demo to Globify.
- **Blockers:** raise them the same day. Don't wait for the weekly demo.
