# 9. Screen inventory and status

All 76 screens from the blueprint (§5), with the blueprint priority and where each one stands.

**Demo column:**

- ✅ built in the demo (mock data)
- ◐ partial
- — not built

**Target column:**

- **20 Nov**: needed for the testing stage (`06-phase-1-plan.md`)
- **1c**: completes the Phase 1 scope during testing
- **1d**: ops tooling for many instances
- **SaaS**: only when Qorloop becomes a shared SaaS (not needed with one instance per customer)
- **P2**: after launch

| ID | Screen | Priority | Demo | Target |
|---|---|---|---|---|
| AUTH-001 | Sign up | P0 | — | SaaS (Phase 1: provisioning + Owner invitation instead) |
| AUTH-002 | Check your email | P0 | — | SaaS |
| AUTH-003 | Email verified | P0 | — | SaaS (invitation acceptance verifies the email) |
| AUTH-004 | Log in | P0 | ◐ (fake) | 20 Nov |
| AUTH-005 | Two-step verification | P0 | — | 20 Nov |
| AUTH-006 | Forgot password | P0 | — | 20 Nov |
| AUTH-007 | Reset password | P0 | — | 20 Nov |
| AUTH-008 | Accept invitation | P0 | — | 20 Nov |
| AUTH-009 | Choose business | P1 | — | SaaS |
| AUTH-010 | Confirm it's you (dialog) | P0 | — | 20 Nov |
| ONB-001 | Business details ("Your store") | P0 | ✅ | 20 Nov |
| ONB-002 | Choose marketplaces | P0 | ✅ | 20 Nov |
| ONB-003 | Upload ERP catalogue | P0 | ✅ | 20 Nov |
| ONB-004 | Catalogue loaded | P0 | ✅ (merged into ONB-003 summary) | 20 Nov |
| ONB-005 | Map marketplace files | P0 | ✅ | 20 Nov |
| ONB-006 | Output templates | P1 | retired (upload formats are built in) | — |
| ONB-007 | You're set up ("Your first check") | P0 | ✅ | 20 Nov |
| DASH-001 | Dashboard | P0 | ✅ | 20 Nov |
| UPL-001 | Upload file (dialog) | P0 | ✅ | 20 Nov |
| UPL-002 | Upload detail / review | P0 | ✅ | 20 Nov |
| UPL-003 | Upload history | P1 | ✅ | 20 Nov |
| UPL-004 | Row errors (drawer) | P0 | ◐ (errors tab) | 20 Nov |
| MAP-001 | Column mapping | P0 | ✅ | 20 Nov |
| RPT-001 | Stock discrepancies | P0 | ✅ | 20 Nov |
| RPT-002 | Price discrepancies | P0 | ✅ | 20 Nov |
| RPT-003 | Recon run history | P2 | — | P2 |
| RPT-004 | Product discrepancy (drawer) | P1 | — | 1c |
| OUT-001 | Generate marketplace file | P0 | ✅ | 20 Nov |
| OUT-002 | Generated files | P0 | ✅ | 20 Nov |
| CAT-001 | All products | P0 | ✅ | 20 Nov |
| CAT-002 | Product detail | P1 | ✅ | 20 Nov |
| CAT-003 | Edit product (drawer) | P1 | ◐ (edits on detail page) | 1c |
| CAT-004 | New products | P0 | ✅ | 20 Nov |
| CAT-005 | Data quality | P1 | — | 1c |
| CAT-006 | Match marketplace row (dialog) | P1 | — | 1c |
| PRC-001 | Marketplace Price (was Markups) | P1 | ✅ | 20 Nov |
| PRC-002 | Bulk price upload (dialog) | P1 | ◐ (bulk modal; file import mocked) | 20 Nov stretch / 1c |
| SET-001 | General and rules | P0 | — | 20 Nov |
| SET-002 | Stores | P2 | — | P2 |
| SET-003 | Marketplaces | P1 | ◐ (onboarding only) | 20 Nov |
| SET-004 | Input templates ("File mappings") | P1 | ✅ (TemplatesView) | 1c |
| SET-005 | Template detail and versions | P1 | — | 1c |
| SET-006 | Output templates ("Upload formats") | P0 | ✅ | 20 Nov (read-only) |
| SET-007 | Catalogue columns | P2 | — | P2 |
| SET-008 | Category mapping | P1 | ✅ | 20 Nov (manual) |
| SET-009 | Members | P0 | ◐ | 20 Nov |
| SET-010 | Invite member (dialog) | P0 | — | 20 Nov |
| SET-011 | Roles and permissions | P2 | — | P2 |
| SET-012 | Security policy | P1 | — | 20 Nov (basic) / 1c |
| SET-013 | Notifications | P2 | — | P2 |
| SET-014 | Data and privacy | P1 | — | 1c |
| SET-015 | Support access | P1 | — | 1c |
| SET-016 | Plan and billing | P2 | — | SaaS |
| ACT-001 | Activity log | P1 | ◐ (product history) | 20 Nov (basic) |
| ACC-001 | Profile | P1 | — | 1c |
| ACC-002 | Password and two-step verification | P0 | — | 20 Nov |
| ACC-003 | Set up authenticator (dialog) | P0 | — | 20 Nov |
| ACC-004 | Active sessions | P1 | — | 1c |
| NOT-001 | Notifications (popover) | P1 | — | 1c |
| HLP-001 | Help | P2 | — | P2 |
| SYS-001 | Page not found (404) | P0 | — | 20 Nov |
| SYS-002 | No access (403) | P0 | — | 20 Nov |
| SYS-003 | Something went wrong (500) | P0 | — | 20 Nov |
| SYS-004 | Maintenance | P2 | — | P2 |
| SYS-005 | Session expired | P0 | — | 20 Nov |
| SYS-006 | Business suspended | P1 | — | 1d (instance suspended page) |
| ADM-001 | Admin login and MFA | P1 | — | SaaS (Phase 1: ops scripts) |
| ADM-002 | Tenants | P1 | — | SaaS (Phase 1: ops scripts) |
| ADM-003 | Tenant detail | P1 | — | SaaS (Phase 1: ops scripts) |
| ADM-004 | Request support access (dialog) | P1 | — | SaaS (Phase 1: ops scripts) |
| ADM-005 | Marketplace category trees | P1 | — | SaaS (Phase 1: ops scripts) |
| ADM-006 | Template library | P2 | — | P2 |
| ADM-007 | Admin users | P1 | — | SaaS (Phase 1: ops scripts) |
| ADM-008 | Platform audit log | P1 | — | SaaS (Phase 1: ops scripts) |
| ADM-009 | Plans and limits | P2 | — | P2 |
| ADM-010 | Platform health | P2 | — | P2 |

New screens that are not yet designed (AUTH-004…008/010, ACC, SYS, SET-001/010) follow the blueprint design system (§7) and reuse the existing components. They don't need new mockups before they are built.
