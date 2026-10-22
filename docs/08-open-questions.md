# 8. Open questions

Each question has an owner and a **default**. Until it is answered, build on the default so work never stops. Update this file when an answer arrives (with date and who decided).

| # | Question | Owner | Needed by | Default until answered |
|---|---|---|---|---|
| Q1 | Is the category / subcategory list **fixed** (ours) or **merchant-defined** and mapped to each marketplace? Is a subcategory required to activate a product? | Client (Job) | 2 Nov | Ship a starter list, copied into each tenant and editable by Owner/Admin. Subcategory optional. |
| Q2 | How should **marketplace category detection** work? | Client (Job to propose) | Phase 1c | Manual mapping per category (SET-008) |
| Q3 | Fourth marketplace: **Keeta or Jahez**? | Client | 2 Nov | Keep Keeta as "comparison only". Add Jahez as data only once its file format is known. |
| Q4 | UI name: **"Marketplace price"** or "Selling price"? | Client | 9 Nov | "Marketplace price" |
| Q5 | Do **offer prices** auto-expire ("valid until") or are they removed manually? | Client | 9 Nov | Optional "valid until"; the offer stops applying after that date |
| Q6 | Bulk price file key: **barcode** or ERP SKU? | Client | 9 Nov | Barcode |
| Q7 | Are product **images** in Phase 1? | Client (Sam asked) | 2 Nov | No. The image field exists but isn't required. |
| Q8 | **Hosting region / data residency** for production (Qatar?) | Globify + client | 26 Oct | Staging on GCP `me-central1` (Doha) or Azure Qatar Central |
| Q9 | Pricing precedence: is the per-marketplace override **above** or **below** product and category rules? | Globify + client | 9 Nov | As implemented in `src/lib/pricing.ts`: offer → product → category → per-marketplace → default |
| Q10 | Real **sample files**: ERP exports from 2–3 retailers, plus each marketplace's export and bulk upload format (Rafeeq and Keeta/Jahez formats are not confirmed) | Globify (from client) | 26 Oct | Use `public/samples/*.xlsx` (synthetic) |
| Q11 | **Email sending domain** and product domain (e.g. app.qorloop.com) | Globify | 26 Oct | Use a staging subdomain owned by Globify |
| Q12 | Default **price tolerance** (0.00 QAR?) and **stale window** (12 h?) | Client | 9 Nov | 0.00 QAR and 12 h, editable in Settings |
| Q13 | **Rounding:** the demo has 0.05 steps (recon) and Exact / 0.25 / 0.50 (Marketplace Price). Which options? | Client | 9 Nov | Exact, 0.05, 0.25, 0.50; default Exact |
| Q14 | **Retention:** how long do we keep uploaded originals and generated files? | Client | Phase 1c | Uploads 90 days, generated files 30 days |
| Q15 | Which screens are **design-approved**, and which are still pending? | Globify | 26 Oct | Build all flows on the current design; restyle later |
| Q16 | Who runs customer instances (provisioning, releases, support access) at launch: Globify, the client, or both? | Client | Phase 1d | Globify |
| Q17 | **Main domain** for customer subdomains (e.g. `<store>.qorloop.com`), and can a customer use their own domain? | Globify + client | 26 Oct | `<store>.qorloop.com`; no custom domains in Phase 1 |

## Answered

| # | Question | Answer | Date / by |
|---|---|---|---|
| — | Markup vs Marketplace Price | One Marketplace Price across all marketplaces; per-marketplace is advanced | 15 Oct, client demo |
| — | Stock comparison | Availability (True/False), not quantity | Client sample files |
| — | Marketplace display | Neutral text labels, no logos; blueprint colours for now | 6 Oct, blueprint approval |
| — | Dark mode | Not a priority; build design tokens now | 15 Oct, client demo |
| — | Reports in Phase 1 | Only the mismatch reports; no analytics reports | Globify |
| — | Qatar compliance add-on | Later phase, separate proposal | Globify |
| — | Deployment model | One instance per customer on its own subdomain; code tenant-ready for a future shared SaaS | 22 Oct, Globify |
