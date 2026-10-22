// Building corrected marketplace files in each marketplace's own column layout.
import { allRows, ReconRow } from './recon';
import { DemoState, GeneratedFile, MarketplaceId } from './types';
import { MARKETPLACE_CATEGORIES } from './catalogData';

export type FileKind = 'stock' | 'price' | 'stock_price' | 'new_products';
export type FileScope = 'mismatches' | 'all';

export interface FilePreview {
  marketplaceId: MarketplaceId;
  kind: FileKind;
  scope: FileScope;
  rows: ReconRow[];
  productCount: number;
  priceChanges: number;
  availabilityChanges: number;
  largestPriceChange: { name: string; from: number; to: number; diff: number } | null;
  blockedReason: string | null; // e.g. output template missing
  /** New-products files only: Qorloop categories that still need this marketplace's category name. */
  unmappedCategoryIds: string[];
  fileName: string;
  columns: string[];
  sheetRows: Record<string, string | number | boolean | null>[];
}

const KIND_LABEL: Record<FileKind, string> = { stock: 'Stock', price: 'Price', stock_price: 'Update', new_products: 'NewProducts' };

function stamp(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Qatar', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${g('day')}${g('month')}${g('year')}_${g('hour')}${g('minute')}`;
}

export function rowsForFile(state: DemoState, mp: MarketplaceId, kind: FileKind, scope: FileScope): ReconRow[] {
  const rows = allRows(state).filter((r) => r.marketplaceId === mp);
  if (kind === 'new_products') {
    return rows.filter((r) => r.status === 'not_listed');
  }
  const listed = rows.filter((r) => r.listing && r.status !== 'missing_from_erp');
  if (scope === 'all') return listed;
  return listed.filter((r) =>
    kind === 'stock' ? !!r.stockIssue : kind === 'price' ? r.priceMismatch : r.priceMismatch || !!r.stockIssue,
  );
}

function categoryFor(state: DemoState, mp: MarketplaceId, categoryId: string): string | null {
  return state.categoryMappings.find((c) => c.marketplaceId === mp && c.categoryId === categoryId)?.marketplaceCategory ?? null;
}

function sheetRow(state: DemoState, mp: MarketplaceId, r: ReconRow, kind: FileKind): Record<string, string | number | boolean | null> {
  const p = r.product;
  const price = r.expectedPrice;
  const active = r.erpAvailable;
  const id = r.listing?.marketplaceProductId ?? p.barcode;
  switch (mp) {
    case 'talabat':
      return {
        sku: id, name: p.nameEn, price: price.toFixed(2), active, maximumSalesQuantity: null, isWeighted: false,
        baseWeight: null, baseWeightUnit: null, pricePerBaseUnit: null, 'barcode 1': p.barcode.padStart(14, '0'),
        'barcode 2': null, 'barcode 3': null, 'category 1': kind === 'new_products' ? categoryFor(state, mp, p.categoryId) : null,
      };
    case 'snoonu':
      return {
        'Barcode(UniqueIdentifier)': id, 'Product Name (En)(ReadOnly)': p.nameEn, 'SKU(ReadOnly)': p.sku, 'Barcode(ReadOnly)': p.barcode,
        'Price(Update)': price.toFixed(2), 'Availability(Update)': active ? 'True' : 'False', 'Images(Custom)': '',
      };
    case 'rafeeq':
      return { 'Item ID': id, EAN: p.barcode, 'Item Name': p.nameEn, 'Selling Price': price.toFixed(2), 'In Stock': active ? 'Yes' : 'No' };
    default:
      return { barcode: p.barcode, name: p.nameEn, name_ar: p.nameAr, price: price.toFixed(2), available: active };
  }
}

export function previewFile(state: DemoState, mp: MarketplaceId, kind: FileKind, scope: FileScope): FilePreview {
  const tpl = state.outputTemplates.find((t) => t.marketplaceId === mp);
  const mpName = state.marketplaces.find((m) => m.id === mp)!.name;
  const rows = rowsForFile(state, mp, kind, scope);
  let blockedReason: string | null = null;
  let unmappedCategoryIds: string[] = [];
  if (kind === 'new_products') {
    const unmapped = rows.filter((r) => !categoryFor(state, mp, r.product.categoryId));
    unmappedCategoryIds = [...new Set(unmapped.map((r) => r.product.categoryId))];
    if (unmapped.length) blockedReason = `Choose the ${mpName} category for ${unmappedCategoryIds.length} of your categories (${unmapped.length} product(s)) below.`;
  }
  if (!tpl?.configured) blockedReason = `${mpName} upload format is missing. Add it under File mapping.`;
  let largest: FilePreview['largestPriceChange'] = null;
  for (const r of rows) {
    if (r.actualPrice === null || !r.priceMismatch) continue;
    const diff = r.expectedPrice - r.actualPrice;
    if (!largest || Math.abs(diff) > Math.abs(largest.diff)) largest = { name: r.product.nameEn, from: r.actualPrice, to: r.expectedPrice, diff: Math.round(diff * 100) / 100 };
  }
  return {
    marketplaceId: mp, kind, scope, rows,
    productCount: rows.length,
    priceChanges: rows.filter((r) => r.priceMismatch).length,
    availabilityChanges: rows.filter((r) => !!r.stockIssue).length,
    largestPriceChange: largest,
    blockedReason,
    unmappedCategoryIds,
    fileName: `${mpName}_${KIND_LABEL[kind]}_${stamp(state.now)}.xlsx`,
    columns: tpl?.columns ?? [],
    sheetRows: rows.map((r) => sheetRow(state, mp, r, kind)),
  };
}

/** Record a generated file. */
export function recordGenerated(state: DemoState, prev: FilePreview): { state: DemoState; file: GeneratedFile } {
  const file: GeneratedFile = {
    id: 'gf-' + (state.generatedFiles.length + 1) + '-' + Math.random().toString(36).slice(2, 6),
    marketplaceId: prev.marketplaceId, kind: prev.kind, fileName: prev.fileName, productCount: prev.productCount,
    generatedBy: state.currentUser.name, generatedAt: state.now,
  };
  return { state: { ...state, generatedFiles: [file, ...state.generatedFiles] }, file };
}

/**
 * Demo helper: pretend the user uploaded the generated file to the marketplace portal
 * and the marketplace accepted it. Listings now match what Qorloop expects.
 */
export function simulateMarketplaceAccepted(state: DemoState, prev: FilePreview): DemoState {
  const s = structuredClone(state);
  for (const r of prev.rows) {
    const l = s.listings.find((x) => x.productId === r.product.id && x.marketplaceId === prev.marketplaceId);
    if (l) { l.price = r.expectedPrice; l.available = r.erpAvailable; }
    else if (prev.kind === 'new_products') {
      s.listings.push({ productId: r.product.id, marketplaceId: prev.marketplaceId, marketplaceProductId: r.product.barcode, price: r.expectedPrice, available: r.erpAvailable, uploadId: 'portal' });
    }
  }
  return s;
}

/** The marketplace's own category names Qorloop knows about (for the inline category picker). */
export function marketplaceCategoryOptions(mp: MarketplaceId): string[] {
  return [...new Set(Object.values(MARKETPLACE_CATEGORIES[mp] ?? {}).filter((v): v is string => !!v))].sort();
}
