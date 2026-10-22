// Turning an uploaded sheet into a review, and applying it to the catalogue.
import { normalizeBarcode, round2 } from './pricing';
import { latestUpload } from './recon';
import { CATEGORIES } from './catalogData';
import {
  ActivityEntry, DemoState, ErpRow, InputTemplate, Listing, MarketplaceId, MarketplaceRow, ParsedUpload,
  PendingReview, Product, RowError, SourceId, UploadRecord,
} from './types';

export type SheetRow = Record<string, unknown>;

/** Qorloop fields a user can map, per source type. Marketplace availability OR quantity is accepted. */
export const ERP_FIELDS = [
  { key: 'barcode', label: 'Barcode', required: true },
  { key: 'nameEn', label: 'Product name (English)', required: true },
  { key: 'nameAr', label: 'Product name (Arabic)', required: false },
  { key: 'price', label: 'Selling price (QAR)', required: true },
  { key: 'cost', label: 'Cost price (QAR)', required: false },
  { key: 'stock', label: 'Stock quantity', required: true },
  { key: 'active', label: 'Active', required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'brand', label: 'Brand', required: false },
] as const;

export const MARKETPLACE_FIELDS = [
  { key: 'marketplaceProductId', label: 'Marketplace product ID', required: true },
  { key: 'barcode1', label: 'Barcode', required: true },
  { key: 'barcode2', label: 'Barcode 2', required: false },
  { key: 'barcode3', label: 'Barcode 3', required: false },
  { key: 'name', label: 'Product name', required: false },
  { key: 'price', label: 'Price (QAR)', required: true },
  { key: 'available', label: 'Availability (True/False) or stock quantity', required: true },
] as const;

export function fieldsFor(source: SourceId) {
  return source === 'erp' ? ERP_FIELDS : MARKETPLACE_FIELDS;
}

/** Find a saved template whose signature headers are all present. */
export function detectTemplate(state: DemoState, source: SourceId, headers: string[]): InputTemplate | null {
  const set = new Set(headers.map((h) => h.trim().toLowerCase()));
  return (
    state.inputTemplates.find(
      (t) => t.source === source && t.signature.every((s) => set.has(s.trim().toLowerCase())),
    ) ?? null
  );
}

/** Best-effort automatic suggestion for the mapping screen. */
export function suggestMapping(source: SourceId, headers: string[]): Record<string, string> {
  const hints: Record<string, string[]> = {
    barcode: ['barcode', 'ean', 'upc', 'gtin', 'id'],
    nameEn: ['name', 'item', 'product name', 'description'],
    nameAr: ['arabic', 'name ar', 'name_ar'],
    price: ['sale price', 'selling price', 'price', 'retail'],
    cost: ['cost'],
    stock: ['quantity', 'qty', 'stock', 'available qty'],
    active: ['active', 'status', 'enabled'],
    category: ['category', 'tag 1', 'department'],
    brand: ['brand'],
    marketplaceProductId: ['sku', 'item id', 'item code', 'product id', 'id'],
    barcode1: ['barcode 1', 'barcode', 'ean', 'gtin'],
    barcode2: ['barcode 2'],
    barcode3: ['barcode 3'],
    name: ['name', 'product name', 'title'],
    available: ['availability', 'available', 'active', 'in stock', 'status', 'stock'],
  };
  const out: Record<string, string> = {};
  const used = new Set<string>();
  for (const f of fieldsFor(source)) {
    const keys = hints[f.key] ?? [];
    const hit = headers.find((h) => !used.has(h) && keys.some((k) => h.toLowerCase() === k))
      ?? headers.find((h) => !used.has(h) && keys.some((k) => h.toLowerCase().includes(k)));
    if (hit) { out[f.key] = hit; used.add(hit); }
  }
  return out;
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function toBool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v;
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (['true', 'yes', 'y', '1', 'active', 'available', 'in stock'].includes(s)) return true;
  if (['false', 'no', 'n', '0', 'inactive', 'unavailable', 'out of stock', 'sold out'].includes(s)) return false;
  const n = toNum(v);
  return n === null ? null : n > 0; // a quantity column also works: >0 = available
}

function str(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

/** Apply a field→column mapping to raw sheet rows. */
export function mapRows(source: SourceId, rows: SheetRow[], fields: Record<string, string>) {
  const errors: RowError[] = [];
  if (source === 'erp') {
    const out: ErpRow[] = [];
    rows.forEach((r, i) => {
      const rowNo = i + 2; // header is row 1
      const barcode = normalizeBarcode(str(r[fields.barcode]));
      const price = toNum(r[fields.price]);
      const stock = toNum(r[fields.stock]);
      if (!barcode) { errors.push({ row: rowNo, column: fields.barcode, value: str(r[fields.barcode]), reason: 'Barcode is empty' }); return; }
      if (price === null || price <= 0) { errors.push({ row: rowNo, column: fields.price, value: str(r[fields.price]), reason: 'Price must be a number above 0' }); return; }
      if (stock === null || stock < 0) { errors.push({ row: rowNo, column: fields.stock, value: str(r[fields.stock]), reason: 'Stock must be 0 or more' }); return; }
      out.push({
        barcode, nameEn: str(r[fields.nameEn]), nameAr: fields.nameAr ? str(r[fields.nameAr]) : undefined,
        brand: fields.brand ? str(r[fields.brand]) : undefined, category: fields.category ? str(r[fields.category]) : undefined,
        price: round2(price), cost: fields.cost ? toNum(r[fields.cost]) ?? undefined : undefined, stock,
        active: fields.active ? toBool(r[fields.active]) ?? true : true,
      });
    });
    return { erpRows: out, errors };
  }
  const out: MarketplaceRow[] = [];
  rows.forEach((r, i) => {
    const rowNo = i + 2;
    const barcodes = [fields.barcode1, fields.barcode2, fields.barcode3].filter(Boolean).map((c) => normalizeBarcode(str(r[c]))).filter(Boolean);
    const price = toNum(r[fields.price]);
    const available = toBool(r[fields.available]);
    if (!barcodes.length) { errors.push({ row: rowNo, column: fields.barcode1, value: '', reason: 'Barcode is empty' }); return; }
    if (price === null) { errors.push({ row: rowNo, column: fields.price, value: str(r[fields.price]), reason: 'Price is not a number' }); return; }
    if (available === null) { errors.push({ row: rowNo, column: fields.available, value: str(r[fields.available]), reason: 'Availability must be True/False or a quantity' }); return; }
    out.push({ marketplaceProductId: str(r[fields.marketplaceProductId]) || barcodes[0], barcodes, name: str(r[fields.name]), price: round2(price), available });
  });
  return { marketplaceRows: out, errors };
}

export function parseUpload(
  state: DemoState, source: SourceId, fileName: string, fileSizeKb: number, contains: 'full' | 'partial',
  headers: string[], rows: SheetRow[], mapping?: { templateId: string; fields: Record<string, string> },
): ParsedUpload {
  const tpl = mapping ? { id: mapping.templateId, fields: mapping.fields } : detectTemplate(state, source, headers);
  const base: ParsedUpload = { source, fileName, fileSizeKb, contains, templateId: tpl?.id ?? null, headers, errors: [], rowsRead: rows.length };
  if (!tpl) return base; // needs mapping
  const mapped = mapRows(source, rows, tpl.fields);
  return { ...base, ...mapped };
}

/** Compare a parsed upload with the current catalogue / listings. */
export function buildReview(state: DemoState, up: ParsedUpload): PendingReview {
  const byBarcode = new Map(state.products.map((p) => [normalizeBarcode(p.barcode), p] as const));
  const review: PendingReview = {
    upload: up, priceChanges: [], stockChanges: [], availabilityChanges: [], newProducts: [], missing: [], unmatched: [],
    errors: up.errors,
    summary: { rowsRead: up.rowsRead, matched: 0, newProducts: 0, rowsWithErrors: up.errors.length, priceChanges: 0, stockChanges: 0, missingFromFile: 0 },
  };

  if (up.source === 'erp') {
    const seen = new Set<string>();
    for (const r of up.erpRows ?? []) {
      const p = byBarcode.get(r.barcode);
      if (!p) { review.newProducts.push(r); continue; }
      seen.add(p.id);
      review.summary.matched++;
      if (round2(p.erpPrice) !== round2(r.price)) review.priceChanges.push({ productId: p.id, barcode: p.barcode, nameEn: p.nameEn, nameAr: p.nameAr, oldValue: p.erpPrice, newValue: r.price });
      if (p.erpStock !== r.stock) review.stockChanges.push({ productId: p.id, barcode: p.barcode, nameEn: p.nameEn, nameAr: p.nameAr, oldValue: p.erpStock, newValue: r.stock });
    }
    if (up.contains === 'full') {
      for (const p of state.products) if (p.inLatestErpFile && !seen.has(p.id)) review.missing.push({ productId: p.id, barcode: p.barcode, nameEn: p.nameEn });
    }
  } else {
    const mpId = up.source as MarketplaceId;
    const current = new Map(state.listings.filter((l) => l.marketplaceId === mpId).map((l) => [l.productId, l] as const));
    const seen = new Set<string>();
    for (const r of up.marketplaceRows ?? []) {
      const p = r.barcodes.map((b) => byBarcode.get(b)).find(Boolean);
      if (!p) { review.unmatched.push(r); continue; }
      seen.add(p.id);
      review.summary.matched++;
      const old = current.get(p.id);
      if (!old || round2(old.price) !== round2(r.price)) review.priceChanges.push({ productId: p.id, barcode: p.barcode, nameEn: p.nameEn, nameAr: p.nameAr, oldValue: old?.price ?? NaN, newValue: r.price });
      if (!old || old.available !== r.available) review.availabilityChanges.push({ productId: p.id, barcode: p.barcode, nameEn: p.nameEn, nameAr: p.nameAr, oldValue: old?.available ?? null, newValue: r.available });
    }
    if (up.contains === 'full') {
      for (const [pid] of current) if (!seen.has(pid)) {
        const p = state.products.find((x) => x.id === pid)!;
        review.missing.push({ productId: p.id, barcode: p.barcode, nameEn: p.nameEn });
      }
    }
  }
  review.summary.newProducts = review.newProducts.length;
  review.summary.priceChanges = review.priceChanges.length;
  review.summary.stockChanges = up.source === 'erp' ? review.stockChanges.length : review.availabilityChanges.length;
  review.summary.missingFromFile = review.missing.length;
  return review;
}

function nextId(prefix: string, list: { id: string }[]): string {
  return prefix + (list.length + 1) + '-' + Math.random().toString(36).slice(2, 6);
}

/** Apply a confirmed review. Returns a new state (does not mutate). */
export function applyReview(state: DemoState, review: PendingReview, user = state.currentUser.name): DemoState {
  const up = review.upload;
  const s: DemoState = structuredClone(state);
  const now = s.now;
  const activity: ActivityEntry[] = [];
  const sourceLabel = up.source === 'erp' ? `ERP (${s.tenant.erpName})` : `${s.marketplaces.find((m) => m.id === up.source)!.name} file`;
  const uploadId = nextId('up-' + up.source + '-', s.uploads);

  if (up.source === 'erp') {
    const firstImport = !s.uploads.some((u) => u.source === 'erp');
    const byBarcode = new Map(s.products.map((p) => [normalizeBarcode(p.barcode), p] as const));
    const seen = new Set<string>();
    for (const r of up.erpRows ?? []) {
      const p = byBarcode.get(r.barcode);
      if (p) {
        seen.add(p.id);
        if (p.erpPrice !== r.price) activity.push(act(now, p.id, sourceLabel, 'ERP price', p.erpPrice.toFixed(2), r.price.toFixed(2), user));
        if (p.erpStock !== r.stock) activity.push(act(now, p.id, sourceLabel, 'ERP stock', String(p.erpStock), String(r.stock), user));
        // ERP-owned fields only. Arabic name / category / image / markups stay as managed in Qorloop.
        Object.assign(p, {
          nameEn: r.nameEn || p.nameEn, erpPrice: r.price, costPrice: r.cost ?? p.costPrice, erpStock: r.stock,
          erpActive: r.active, erpCategory: r.category || p.erpCategory, brand: r.brand || p.brand,
          inLatestErpFile: true, updatedAt: now, updatedBy: sourceLabel,
        });
        if (!p.erpActive && p.status === 'active') p.status = 'inactive';
      } else {
        const cat = guessCategory(s, r.category);
        const np: Product = {
          id: 'p' + String(s.products.length + 1).padStart(3, '0'), barcode: r.barcode, sku: r.sku ?? '',
          nameEn: r.nameEn, nameAr: r.nameAr ?? '', brand: r.brand ?? '', size: r.size ?? '', erpCategory: r.category ?? '',
          erpPrice: r.price, costPrice: r.cost ?? 0, erpStock: r.stock, erpActive: r.active, inLatestErpFile: true,
          categoryId: cat?.id ?? '', imageKey: '', status: firstImport ? 'active' : 'new', createdAt: now, updatedAt: now, updatedBy: sourceLabel,
        };
        s.products.push(np);
        seen.add(np.id);
        activity.push(act(now, np.id, sourceLabel, 'Product', '', 'Created from ERP file', user));
      }
    }
    if (up.contains === 'full') for (const p of s.products) if (!seen.has(p.id)) p.inLatestErpFile = false;
  } else {
    const mpId = up.source as MarketplaceId;
    const byBarcode = new Map(s.products.map((p) => [normalizeBarcode(p.barcode), p] as const));
    const fresh: Listing[] = [];
    for (const r of up.marketplaceRows ?? []) {
      const p = r.barcodes.map((b) => byBarcode.get(b)).find(Boolean);
      if (!p) continue;
      const old = s.listings.find((l) => l.productId === p.id && l.marketplaceId === mpId);
      if (old && old.price !== r.price) activity.push(act(now, p.id, sourceLabel, `${mpName(s, mpId)} price`, old.price.toFixed(2), r.price.toFixed(2), user));
      fresh.push({ productId: p.id, marketplaceId: mpId, marketplaceProductId: r.marketplaceProductId, price: r.price, available: r.available, uploadId });
    }
    const keep = up.contains === 'full'
      ? s.listings.filter((l) => l.marketplaceId !== mpId)
      : s.listings.filter((l) => l.marketplaceId !== mpId || !fresh.some((f) => f.productId === l.productId));
    s.listings = [...keep, ...fresh];
  }

  const record: UploadRecord = {
    id: uploadId, source: up.source, fileName: up.fileName, fileSizeKb: up.fileSizeKb, contains: up.contains,
    uploadedBy: user, uploadedAt: now, status: 'applied', templateId: up.templateId ?? '', summary: review.summary,
  };
  s.uploads = [record, ...s.uploads];
  s.activity = [...activity, ...s.activity];
  s.pendingReview = null;
  return s;
}

function guessCategory(s: DemoState, erpCategory?: string) {
  if (!erpCategory) return undefined;
  const e = erpCategory.trim().toUpperCase();
  const byErp = CATEGORIES.find((c) => c.erpName === e);
  if (byErp) return s.categories.find((c) => c.id === byErp.id);
  return s.categories.find((c) => c.nameEn.toUpperCase() === e || e.includes(c.nameEn.split(' ')[0].toUpperCase()));
}

function mpName(s: DemoState, id: MarketplaceId) {
  return s.marketplaces.find((m) => m.id === id)!.name;
}

function act(at: string, productId: string, source: string, field: string, oldValue: string, newValue: string, user: string): ActivityEntry {
  return { id: 'a-' + Math.random().toString(36).slice(2, 9), at, productId, source, field, oldValue, newValue, user };
}

export function saveTemplate(state: DemoState, source: SourceId, name: string, fields: Record<string, string>, headers: string[]): { state: DemoState; templateId: string } {
  const s = structuredClone(state);
  const id = 'tpl-' + source + '-' + (s.inputTemplates.length + 1);
  const signature = Object.values(fields).filter((h) => headers.includes(h));
  s.inputTemplates.push({ id, source, name, version: 1, fields, signature });
  return { state: s, templateId: id };
}

export function lastUploadLabel(state: DemoState, source: UploadRecord['source']) {
  return latestUpload(state, source);
}

/** Update an existing template's column mapping (new version). */
export function updateTemplate(state: DemoState, templateId: string, name: string, fields: Record<string, string>, headers: string[]): DemoState {
  const s = structuredClone(state);
  const t = s.inputTemplates.find((x) => x.id === templateId);
  if (!t) return state;
  t.name = name;
  t.fields = fields;
  t.version += 1;
  t.signature = Object.values(fields).filter((h) => headers.includes(h));
  return s;
}
