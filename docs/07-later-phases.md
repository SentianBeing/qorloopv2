# 7. After 20 Nov: testing, launch and later phases

Dates after 20 Nov are **indicative**. They are confirmed at the end of Phase 1 based on test results.

## Phase 1b: Testing and fixes (20 Nov → about 4 Dec 2026)

- **Internal QA (week 1):** run the test checklist with every role on real files. Log bugs as GitHub issues labelled `bug` + `P0/P1/P2`.
- **Client acceptance testing (UAT, week 2):** the client team runs their own scenarios, including the scenario-by-scenario catalogue session the client asked for.
- **Fix rule:** P0 bugs are fixed within a day. P1 bugs are fixed before the pilot. P2 bugs go to the backlog.
- **Visual updates** for screens that receive design approval during testing.
- **Exit:** the client signs off UAT in writing.

## Phase 1c: Complete the Phase 1 scope (in parallel with testing, about 3 weeks)

The P1 screens from the blueprint that are not needed to start testing:

| Area | Screens |
|---|---|
| Catalogue quality | Data quality (CAT-005): missing from ERP, name changed, unmatched marketplace rows. Match marketplace row (CAT-006). Edit product drawer (CAT-003). |
| Product drill-down | Product discrepancy drawer (RPT-004) |
| Pricing | Bulk price file import (PRC-002), if cut from Phase 1 |
| File mappings | Input templates list and detail with versions (SET-004/005) |
| Account and security | Profile (ACC-001), active sessions with "log out others" (ACC-004), full security policy (SET-012) |
| Data and privacy | Export all data, retention, delete business with typed confirmation and re-auth (SET-014) |
| Support access | Approve or revoke time-boxed platform support grants (SET-015) |
| Notifications | Notification bell and popover (NOT-001): upload finished or failed, new products, invites. Emails for the same. |
| Multi-tenant users | Choose business after login (AUTH-009) |
| System | Business suspended (SYS-006) |
| Onboarding | Category clean-up tool for our team: bulk-map the first 5–10k products' categories and subcategories at onboarding (client decision 15 Oct) |
| Categories | Periodic (monthly or quarterly) category update file for marketplaces |

## Phase 1d: Ops tooling for many instances (about 1 week)

Each customer runs on its own instance, so Phase 1 doesn't need a platform admin app. It needs scripts that let Globify run many instances safely:

- create an instance (already from Phase 1, task F8/F9), and suspend or delete one
- release to all instances, with migrations and roll back
- an instance list with version, health, last backup and storage used
- restore drills, with one tested restore per month
- support access: Globify can only enter a customer instance with the Owner's approval (SET-015), and every entry is logged

## Later: convert to a shared SaaS (separate decision and proposal)

When Qorloop is sold as true self-serve SaaS, the tenant-ready code lets us move to **one shared deployment** with many tenants:

1. Turn on tenant resolution from the subdomain and enable the Postgres RLS policies.
2. Migrate each instance's database into the shared one. UUIDs and `tenant_id` keys make this a copy, not a rewrite.
3. Add public sign-up (AUTH-001…003), choose business (AUTH-009), plans and billing (SET-016), business suspended (SYS-006).
4. Build the platform admin app, on a separate domain with its own login and MFA (ADM-001):

- Tenants list and detail (ADM-002/003): metadata, plan, usage, suspend, change plan.
- Request support access (ADM-004), linked to the tenant-side approval (SET-015).
- Marketplace category trees (ADM-005): import and version each marketplace's taxonomy. Category mapping then picks from these trees instead of free text.
- Admin users and roles (ADM-007), platform audit log (ADM-008).
- Two-person approval for tenant deletion.

## Pilot and launch (about mid-January 2027, to confirm)

1. **Production:**
   - set up in the confirmed region
   - separate database, secrets and storage
   - monitoring and alerting, backups, an uptime check
2. **Pilot:** 1–2 real retailers run the daily loop for 1–2 weeks. Measure:
   - mismatches found
   - time per daily loop
   - files accepted by marketplace portals without errors
3. **Launch checklist:**
   - security review and pen test
   - privacy policy and terms (client)
   - support process
   - a runbook (deploy, roll back, restore, rotate secrets)

## P2 items (after launch)

Recon run history (RPT-003), stores / multi-branch (SET-002), catalogue column settings (SET-007), roles reference page (SET-011), notification preferences (SET-013), plan and billing (SET-016), help centre (HLP-001), maintenance page (SYS-004), admin template library, plans and limits, platform health (ADM-006/009/010).

## Phase 2: Direct integration (separate proposal)

- **Marketplace connections:** API integrations with Talabat, Snoonu, Rafeeq and others, replacing file upload and download where the marketplace allows it. The navigation already reserves a "Marketplaces" item between Reports and Catalogue.
- **Orders** module (reserved in the navigation).
- **Aggregator taxonomy mapping:** map merchant categories to each aggregator's tree. Add **AI-assisted category suggestions** once there is enough labelled sample data.
- Product **images** (fetch, store, send to marketplaces), pending the client's decision.
- Mismatch **trend charts** (P3), saved table views, Arabic UI, SSO sign-in, self-serve checkout.
- **Dark mode**, cheap if the design tokens are done in Phase 1.

## Qatar security and compliance add-on (separate proposal, later phase)

Data breach monitoring and the other Qatar-specific compliance controls are **not** in Phase 1. They will be quoted separately. Phase 1 choices that make them easier later:

- regional hosting
- the audit log
- data export and deletion
- support-access grants
