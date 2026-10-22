# 3. Architecture

This is the **recommended** architecture. The developer confirms or challenges it in week 1 by writing short decision notes in `docs/decisions/` (task F2). Anything marked *Decide* needs a decision note before code depends on it.

## Guiding choices

- **TypeScript end to end.** The hard business logic (recon, file parsing and mapping, pricing, export formats) already exists in TypeScript, with tests, in `src/demo/` and `src/lib/`. Moving it into a shared package lets the backend reuse it instead of rewriting it. This is the main reason the 20 Nov date is achievable.
- **One source of truth.** The backend owns all data. The front end only displays it and sends commands.
- **Files are processed on the server, in background jobs.** Browsers can't handle 25 MB or 50k-row files reliably, and the blueprint requires uploads to continue if the user leaves the page.
- **One deployment per customer now, SaaS-ready underneath.** Each supermarket gets its own instance on its own subdomain, with its own database and storage. The code is written as if it were multi-tenant (`tenant_id` everywhere, tenant resolved per request), so that it can later become one shared SaaS without a rewrite. See "Deployment model".
- **Keep it boring.** Pick well-known libraries, use one database, and use a managed host.

## Recommended stack

| Layer | Choice | Notes |
|---|---|---|
| Web app | Existing Vite + React + TS + Tailwind | Add React Router and TanStack Query (server state). Add TanStack Table if the tables need it. |
| API | Node 22 + **NestJS** or **Fastify** (TS) | *Decide.* NestJS gives structure (modules, guards for roles); Fastify is lighter. REST + JSON, OpenAPI generated from code. |
| Shared logic | `packages/core` | Pure functions: pricing, recon, mapping and detection, review building, export rows. No I/O. Unit-tested. Used by the API and workers. |
| Database | **PostgreSQL 16** | **Prisma** or **Drizzle** for schema and migrations (*Decide*). One database per customer instance in Phase 1. |
| Background jobs | **BullMQ + Redis** | Upload processing, recon refresh, file generation, emails |
| File storage | S3-compatible object storage | Uploaded originals, generated files (kept 30 days), error reports. Private bucket, signed URLs. |
| Spreadsheets | SheetJS (`xlsx`, already used) or ExcelJS | Read .xlsx/.xls/.csv; write marketplace files. Stream large files where possible. |
| Auth | **Better Auth** (self-hosted library) *or* a managed provider | *Decide by 26 Oct.* See "Auth" below. |
| Email | Transactional provider (Postmark, Amazon SES or Resend) | Verification, reset, invite, "upload finished". Needs the sending domain (open question). |
| Errors and logs | Sentry + structured JSON logs | A request ID is shown on error pages (blueprint SYS-003) |
| CI/CD | GitHub Actions | Lint, typecheck, test on every PR; deploy `main` to staging automatically |
| Hosting | Container host in the chosen region | *Decide with the client.* See "Hosting and region". |

## Repo layout (target)

Use npm workspaces (or pnpm) in this same repo:

```
apps/
  web/            the current front end, moved from ./src
  api/            HTTP API
  worker/         BullMQ job processors (same codebase as api, separate process)
  admin/          platform admin app (only when Qorloop becomes a shared SaaS)
packages/
  core/           business logic moved from src/demo + src/lib/pricing.ts, with its tests
  db/             schema, migrations, seed scripts
infra/            provisioning: one command creates a new customer instance
  shared/         API types / zod schemas shared by web and api
docs/
```

Move the demo as it is into `apps/web` first and check that it still builds. Restructure after that.

## Deployment model: one instance per customer, SaaS-ready underneath

**Phase 1 (what customers get):** each supermarket or business gets **its own Qorloop instance** on its own subdomain (e.g. `dohafresh.qorloop.com`).

- Its own database, storage bucket, secrets and backups.
- The product shows **no tenant concept**: no public sign-up, no "choose business", no tenant switcher, no plans or billing.
- An instance is created by us, not by the customer (see "Provisioning").
- Same code and same release for every customer. Customer differences come only from configuration (name, enabled marketplaces, branding), **never** from per-customer code branches.

**Underneath (internal; not visible in the product):** build every layer so that the same code can later run many customers in **one shared deployment**. Switching to SaaS should be a deployment and data-migration project, not a rewrite.

| Rule | Why it matters later |
|---|---|
| A `tenants` table exists, and each instance has exactly one tenant row | The shared SaaS just has many rows |
| `tenant_id uuid not null` on every customer-owned table, indexed, included in unique keys (e.g. unique `(tenant_id, barcode)`) | Data from separate instances can be merged into one database without clashes |
| **UUIDs** for all primary keys, never auto-increment integers | IDs from different instances never collide when merged |
| A **tenant context** per request, resolved by one resolver: in Phase 1 from config (`TENANT_ID` env), later from the subdomain (`Host` header) | Changing where the tenant comes from is a one-file change |
| **Every** query goes through a repository / data-access layer that adds `tenant_id`; no raw queries in route handlers | Nothing has to be audited and rewritten later |
| Storage keys are prefixed `tenants/{tenant_id}/…`; job payloads and cache keys carry `tenant_id` | Shared bucket, queue and Redis later |
| Users link to the tenant through a `memberships` table (user, tenant, role), not a role on the user | Users in several businesses later (AUTH-009) |
| Settings are per tenant in the database, not in env vars (env only for infrastructure: DB URL, secrets, `TENANT_ID`) | Each tenant keeps its own settings in a shared deployment |
| Platform-level things (marketplace definitions, upload formats, starter categories) live in global tables without `tenant_id` | They are shared by all tenants later |
| Write the Postgres RLS policies now, but they may stay disabled until the shared deployment | Turning them on is the final safety net when going SaaS |
| Tests run with **two tenants in one database** and prove neither can see the other | The code is proven SaaS-safe even though production is single-tenant |

**Data stays separate in Phase 1:** each customer's data lives only in its own instance. If customers are later moved onto a shared deployment, first check what their contracts and privacy terms promise about dedicated hosting.

## Provisioning a customer instance

One scripted command (`infra/`, using Terraform, Pulumi or a plain script; *Decide*) sets up a new customer:

1. Creates the subdomain and TLS certificate.
2. Creates the database, storage bucket, Redis namespace and secrets.
3. Deploys the current release and runs the migrations.
4. Creates the tenant row (name, country, currency, time zone) and enables the chosen marketplaces.
5. Creates the first **Owner** and sends them an invitation email. They set a password and MFA, then land in onboarding.

Upgrades: CI builds one image, and a release job runs the migrations and deploys it to **every** instance. An instance never runs a different version for long.

Internal ops (not a customer screen): a small CLI or script to list instances, their version, health and last backup. This becomes the admin app (ADM-xxx) when Qorloop turns into a shared SaaS.

## Auth

Phase 1 needs:

- **no public sign-up in Phase 1.** The first Owner is created by provisioning and receives an invitation. Keep the sign-up code path in mind (AUTH-001…003) for the SaaS later, but don't build the screens now.
- email verification (on invite acceptance and email change)
- login
- logout
- forgot and reset password
- invite and accept (sets name and password)
- **TOTP MFA** with recovery codes (mandatory for Owners; tenant policy can require it for all)
- re-auth before sensitive actions (AUTH-010)
- idle and absolute session timeout
- a session list with "log out other sessions" (ACC-004, can follow after 20 Nov)

Options:

1. **Better Auth** (open-source TS library, runs inside our API, stores users in our Postgres).
   - It has email/password, email verification, a two-factor (TOTP) plugin and an organization plugin (which fits the tenant + membership model).
   - Pros: user data stays in our database and region, no per-user fees, full control.
   - Cons: we own the security of it.
2. **A managed provider** (Clerk, Auth0, AWS Cognito, Supabase Auth).
   - Pros: the provider looks after MFA and security.
   - Cons: user data sits with a third party, possibly outside the region, which may matter for the Qatar compliance add-on; per-user cost; less control over the invite and tenant flow.

**Recommendation:** Better Auth (option 1), because of data residency and the tenant/role model, unless the developer has a strong reason otherwise. Never write password hashing or TOTP from scratch.

Roles: enforce them server-side with a guard per endpoint. One permission map (role → allowed actions) lives in `packages/shared` and is also used by the web app to hide controls.

## File pipeline (uploads)

```
Browser ──(1) request upload URL──▶ API ──▶ creates Upload(status=uploading), returns signed PUT URL
Browser ──(2) PUT file────────────▶ Object storage
Browser ──(3) "uploaded"──────────▶ API ──▶ enqueue job "process-upload"
Worker:  scan → check → detect layout → read rows → build review   (status + step saved on each stage)
         • layout unknown → status=needs_mapping (UI shows MAP-001)
         • review ready   → status=needs_review  (UI shows UPL-002)
User:    "Confirm and apply" ──▶ API ──▶ enqueue "apply-upload" ──▶ worker writes products/listings in one transaction
         ──▶ status=applied ──▶ recon refresh ──▶ notification
```

- The steps match the blueprint stepper: **Scan, Check, Detect, Read, Review, Apply**. Store `step` and `progress` on the upload so the UI can poll (every 2 s), or use SSE.
- Checks:
  - extension and MIME type (.xlsx, .xls, .csv)
  - 25 MB maximum
  - reject macros and encrypted files
  - reject files where more than 20% of rows are invalid (blueprint J1 error case)
- Row errors are stored per upload (row, column, value, reason) and can be downloaded as .xlsx (UPL-004).
- **Apply must be idempotent and resumable.** If it fails half way, retrying gives the same result. Use one DB transaction per upload, or batched upserts keyed by (tenant, barcode).
- Keep the original file (it's the audit trail) for the retention period (default 90 days, *confirm*).

## Recon

- Computing recon for 50k products × 4 marketplaces is 200k rows. That is fine in SQL or in memory in a worker, but not on every page load.
- **Approach:** after every applied upload or pricing change, a worker recomputes `recon_rows` for the affected tenant (or only the affected products) and stores the counts in `recon_summary`. Reports read the stored rows with server-side filters and pagination. The dashboard reads the summary.
- The compare-against toggle (ERP vs Marketplace Price) changes the expected price. Either store both expected prices and both mismatch flags per row (simple, recommended), or recompute on demand.

## File generation

- Run it as a job, too: build the rows using `packages/core/exports`, write .xlsx/.csv, store the file, and record a `generated_files` row.
- **Preview** (count, price changes, availability changes, largest change, first 10 rows) is a synchronous API call that uses the same function without writing a file.
- Upload formats (`output_templates`) are **built into the product**: one per marketplace, versioned in code or seed data. Retailers don't edit them.

## Hosting and region

The client is in Qatar, and a Qatar compliance add-on is planned for later. Choose a region that won't force a migration then:

- Google Cloud `me-central1` (Doha)
- Azure Qatar Central (Doha)
- AWS `me-central-1` (UAE) as a GCC fallback

*Decide with the client* (open question Q8). Until then, build **staging** on any host in one of these clouds with managed Postgres and Redis, and keep everything in containers so moving is easy.

## Environments

| Env | Purpose | Data |
|---|---|---|
| local | Development | Seed data (adapted from `src/demo/seed.ts`) |
| staging | Weekly demos, testing from 20 Nov. It is the first instance created by the provisioning script. | Test tenant + client sample files (private) |
| production | One instance per customer, each on its own subdomain | That customer's data only; created with the provisioning script after testing |
| demo (local only) | The existing mock demo, presented to the client offline | Mock; tag `demo-v1` so it can be run locally from the tag. Not deployed. |

## Security baseline (Phase 1)

- HTTPS only, HSTS, secure HTTP-only same-site cookies, CSRF protection on cookie sessions.
- Passwords via the auth library (argon2/bcrypt). Rate-limit login, reset and invite endpoints.
- Validate every input with zod. Never trust spreadsheet cell content: escape it for formula injection when writing generated files (prefix `=`, `+`, `-`, `@` with `'`).
- Signed, short-lived URLs for file downloads. Buckets are never public.
- An audit/activity log for logins, role changes, uploads applied, price rule changes and files generated (ACT-001 needs this).
- Daily database backups with a tested restore.
- Dependency scanning (Dependabot) on the repo.
