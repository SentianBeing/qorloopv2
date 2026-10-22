// Deterministic demo database. Same output on every run.
// Story: it is 06 Oct 2026, 09:14 in Doha. Yesterday's ERP file (18:05) and Talabat file (18:40)
// are stale; Snoonu (08:55) and Rafeeq (07:30) were uploaded this morning; Keeta has never been uploaded.
import { CATALOG, CATEGORIES, MARKETPLACE_CATEGORIES, NEW_IN_SEED, CatalogTuple } from './catalogData';
import { expectedPrice } from './pricing';
import {
  ActivityEntry, Category, CategoryMapping, DemoState, GeneratedFile, InputTemplate, Listing, Marketplace,
  MarketplaceId, MarkupOverride, OutputTemplate, Product, TeamMember, UploadRecord,
} from './types';

export const DEMO_VERSION = 2;
export const DEMO_NOW = '2026-10-06T09:14:00+03:00';

export const UPLOAD_IDS = {
  erp: 'up-erp-0510',
  talabat: 'up-talabat-0510',
  snoonu: 'up-snoonu-0610',
  rafeeq: 'up-rafeeq-0610',
} as const;

// ---------- helpers ----------
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Valid EAN-13 from a 12-digit body. */
export function ean13(body12: string): string {
  const digits = body12.split('').map(Number);
  const sum = digits.reduce((s, d, i) => s + d * (i % 2 === 0 ? 1 : 3), 0);
  return body12 + ((10 - (sum % 10)) % 10);
}

// Barcodes shown in the original mockups, kept so screenshots and demo match.
const FIXED_BARCODES: Record<string, string> = {
  'Pepsi 330ml Can': '6281007012345',
  'Baladna Fresh Milk 1L': '6291100231472',
  "Lay's Salted 170g": '6281036112233',
  'Almarai Laban 180ml': '6281007021118',
  'Snickers 50g': '5000159461122',
  'Al Ain Water 1.5L': '6291003001234',
  'Coca-Cola 1.5L': '6289001234567',
  'Nescafe Classic 200g': '6281234567890',
  'Maggi Chicken Stock 20g': '6281012345678',
  'Pringles Original 165g': '5053990154321',
  'KitKat 4 Finger 41.5g': '6291100998877',
  'Oreo Original 36.8g': '7622300441427',
  'Lurpak Butter 200g': '5711953012345',
  'Twix 50g': '5000159422331',
  'Haribo Goldbears 100g': '4001686309152',
  'Bounty 57g': '5000159439957',
};

const PREFIXES = ['628', '629', '500', '762', '871', '590'];

export function barcodeFor(name: string, index: number): string {
  if (FIXED_BARCODES[name]) return FIXED_BARCODES[name];
  const prefix = PREFIXES[index % PREFIXES.length];
  const body = (prefix + String(1000000 + index * 7919).padStart(9, '0')).slice(0, 12);
  return ean13(body);
}

function erpCategoryName(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.erpName ?? 'GENERAL';
}

function costFor(price: number, rnd: () => number): number {
  return Math.round(price * (0.62 + rnd() * 0.14) * 100) / 100;
}

export function makeProduct(t: CatalogTuple, index: number, rnd: () => number, status: Product['status'], createdAt: string): Product {
  const [nameEn, nameAr, brand, size, categoryId, price, imageKey] = t;
  const barcode = barcodeFor(nameEn, index);
  return {
    id: 'p' + String(index + 1).padStart(3, '0'),
    barcode,
    sku: 'DFM-' + String(10000 + index * 37),
    nameEn,
    nameAr,
    brand,
    size,
    erpCategory: erpCategoryName(categoryId),
    erpPrice: price,
    costPrice: costFor(price, rnd),
    erpStock: Math.floor(rnd() * 380) + 12,
    erpActive: true,
    inLatestErpFile: true,
    categoryId,
    imageKey: imageKey || '',
    status,
    createdAt,
    updatedAt: '2026-10-05T18:05:00+03:00',
    updatedBy: 'ERP (RetailOne)',
  };
}

// ---------- scripted demo situations (so the walkthrough always shows the same stories) ----------
// [productName, marketplace, override]
type Scripted = { price?: number; available?: boolean; notListed?: boolean };
const SCRIPTED: [string, MarketplaceId, Scripted][] = [
  ['Pepsi 330ml Can', 'talabat', { price: 2.5 }], // expected 2.75 → lower on Talabat
  ['Baladna Fresh Milk 1L', 'talabat', { available: false }], // in stock in ERP, unavailable on Talabat
  ["Lay's Salted 170g", 'snoonu', { price: 8.95 }], // expected 9.35
  ['Snickers 50g', 'rafeeq', { price: 3.75 }], // expected 3.50
  ['Almarai Laban 180ml', 'snoonu', { price: 1.65 }], // expected 1.95
  ['Coca-Cola 330ml Can', 'talabat', { price: 2.65 }], // expected 2.75
  ['Lurpak Butter 200g', 'rafeeq', { available: false }],
  ['Nescafe Classic 200g', 'talabat', { price: 17.5 }],
  ['Oreo Original 36.8g', 'snoonu', { available: false }],
  ['Pringles Original 165g', 'rafeeq', { price: 9.25 }],
  ['Head & Shoulders Shampoo 400ml', 'rafeeq', { notListed: true }],
  ['Dove Beauty Bar 4 x 100g', 'rafeeq', { notListed: true }],
  ['Pampers Baby-Dry Size 4 (44 pcs)', 'rafeeq', { notListed: true }],
];

// ERP-side scripted facts.
const OUT_OF_STOCK_IN_ERP = ['Al Ain Water 1.5L', 'Tang Orange 375g', 'Nutella 350g']; // stock 0, still available on some marketplaces
const INACTIVE_IN_ERP = ['KitKat 4 Finger 41.5g']; // delisted in ERP, still live on Talabat

export function createSeed(): DemoState {
  const rnd = mulberry32(20261006);

  const marketplaces: Marketplace[] = [
    { id: 'talabat', name: 'Talabat', enabled: true, defaultMarkupPct: 10 },
    { id: 'snoonu', name: 'Snoonu', enabled: true, defaultMarkupPct: 10 },
    { id: 'rafeeq', name: 'Rafeeq', enabled: true, defaultMarkupPct: 8 },
    { id: 'keeta', name: 'Keeta', enabled: true, defaultMarkupPct: 12 },
  ];

  const categories: Category[] = CATEGORIES.map(({ id, nameEn, nameAr }) => ({ id, nameEn, nameAr }));
  const categoryMappings: CategoryMapping[] = [];
  for (const c of categories) {
    for (const m of marketplaces) {
      categoryMappings.push({ categoryId: c.id, marketplaceId: m.id, marketplaceCategory: MARKETPLACE_CATEGORIES[m.id][c.id] ?? null });
    }
  }

  const products: Product[] = CATALOG.map((t, i) => makeProduct(t, i, rnd, 'active', '2026-03-12T10:00:00+03:00'));
  NEW_IN_SEED.forEach((t, j) => {
    const p = makeProduct(t, CATALOG.length + j, rnd, 'new', '2026-10-05T18:05:00+03:00');
    p.nameAr = ''; // Arabic name still to be filled in Qorloop
    products.push(p);
  });

  for (const p of products) {
    if (OUT_OF_STOCK_IN_ERP.includes(p.nameEn)) p.erpStock = 0;
    if (INACTIVE_IN_ERP.includes(p.nameEn)) { p.erpActive = false; p.status = 'inactive'; }
  }

  // A few product-level markup overrides (premium items carry a higher markup on Talabat).
  const markups: MarkupOverride[] = [];
  const byName = (n: string) => products.find((p) => p.nameEn === n)!;
  markups.push({ productId: byName('Abu Kass Basmati Rice 5kg').id, marketplaceId: 'talabat', markupPct: 6 });
  markups.push({ productId: byName('Pampers Baby-Dry Size 4 (44 pcs)').id, marketplaceId: 'talabat', markupPct: 5 });
  markups.push({ productId: byName('Pampers Baby-Dry Size 4 (44 pcs)').id, marketplaceId: 'snoonu', markupPct: 5 });
  markups.push({ productId: byName('Royal Canin Kitten 400g').id, marketplaceId: 'snoonu', markupPct: 15 });

  const markupFor = (productId: string, mp: Marketplace) =>
    markups.find((m) => m.productId === productId && m.marketplaceId === mp.id)?.markupPct ?? mp.defaultMarkupPct;

  // Listings: every active / inactive product on Talabat, Snoonu, Rafeeq (Keeta has no file yet).
  const listings: Listing[] = [];
  for (const p of products) {
    if (p.status === 'new') continue;
    for (const mp of marketplaces) {
      if (mp.id === 'keeta') continue;
      const scripted = SCRIPTED.find(([n, m]) => n === p.nameEn && m === mp.id)?.[2];
      if (scripted?.notListed) continue;
      const exp = expectedPrice(p.erpPrice, markupFor(p.id, mp));
      const erpAvailable = p.erpActive && p.erpStock > 0;
      let price = exp;
      let available = erpAvailable;
      // Out-of-stock / inactive items: only Snoonu and Talabat picked up the change late.
      if (!erpAvailable) available = mp.id === 'rafeeq' ? false : true;
      if (scripted?.price !== undefined) price = scripted.price;
      if (scripted?.available !== undefined) available = scripted.available;
      listings.push({
        productId: p.id,
        marketplaceId: mp.id,
        marketplaceProductId: `${mp.id.slice(0, 2).toUpperCase()}-${p.barcode.slice(-7)}`,
        price,
        available,
        uploadId: UPLOAD_IDS[mp.id as 'talabat' | 'snoonu' | 'rafeeq'],
      });
    }
  }

  const team: TeamMember[] = [
    { id: 'u1', name: 'Omar Haddad', email: 'omar@dohafresh.qa', role: 'Catalogue Manager', status: 'Active' },
    { id: 'u2', name: 'Fatima Al-Kuwari', email: 'fatima@dohafresh.qa', role: 'Owner', status: 'Active' },
    { id: 'u3', name: 'Rahul Menon', email: 'rahul@dohafresh.qa', role: 'Admin', status: 'Active' },
    { id: 'u4', name: 'Aisha Rahman', email: 'aisha@dohafresh.qa', role: 'Catalogue Manager', status: 'Active' },
    { id: 'u5', name: 'Khalid Nasser', email: 'khalid@dohafresh.qa', role: 'Analyst', status: 'Invited' },
  ];

  const count = (mp: MarketplaceId) => listings.filter((l) => l.marketplaceId === mp).length;
  const uploads: UploadRecord[] = [
    upload(UPLOAD_IDS.rafeeq, 'rafeeq', 'rafeeq_catalogue_06Oct.xlsx', 212, '2026-10-06T07:30:00+03:00', 'Aisha Rahman', 'tpl-rafeeq', count('rafeeq')),
    upload(UPLOAD_IDS.snoonu, 'snoonu', 'snoonu_products_06Oct.xlsx', 188, '2026-10-06T08:55:00+03:00', 'Omar Haddad', 'tpl-snoonu', count('snoonu')),
    upload(UPLOAD_IDS.talabat, 'talabat', 'talabat_items_05Oct.xlsx', 240, '2026-10-05T18:40:00+03:00', 'Rahul Menon', 'tpl-talabat', count('talabat')),
    upload(UPLOAD_IDS.erp, 'erp', 'Item_Master_05Oct2026.xlsx', 356, '2026-10-05T18:05:00+03:00', 'Omar Haddad', 'tpl-erp-retailone', products.length),
  ];

  const inputTemplates: InputTemplate[] = [
    {
      id: 'tpl-erp-retailone', source: 'erp', name: 'RetailOne item master (v3)', version: 3,
      fields: { barcode: 'ID', nameEn: 'Name*', nameAr: 'Arabic Name', category: 'Product Category Name', brand: 'Brand', price: 'Sale Price', cost: 'Cost Price', stock: 'Quantity', active: 'Active' },
      signature: ['ID', 'Name*', 'Sale Price', 'Quantity', 'Active'],
    },
    {
      id: 'tpl-talabat', source: 'talabat', name: 'Talabat catalogue export', version: 1,
      fields: { marketplaceProductId: 'sku', name: 'name', price: 'price', available: 'active', barcode1: 'barcode 1', barcode2: 'barcode 2', barcode3: 'barcode 3' },
      signature: ['sku', 'name', 'price', 'active', 'barcode 1'],
    },
    {
      id: 'tpl-snoonu', source: 'snoonu', name: 'Snoonu bulk update file', version: 1,
      fields: { marketplaceProductId: 'Barcode(UniqueIdentifier)', name: 'Product Name (En)(ReadOnly)', price: 'Price(Update)', available: 'Availability(Update)', barcode1: 'Barcode(ReadOnly)' },
      signature: ['Barcode(UniqueIdentifier)', 'Price(Update)', 'Availability(Update)'],
    },
    {
      id: 'tpl-rafeeq', source: 'rafeeq', name: 'Rafeeq product export', version: 1,
      fields: { marketplaceProductId: 'Item ID', name: 'Item Name', price: 'Selling Price', available: 'In Stock', barcode1: 'EAN' },
      signature: ['Item ID', 'Item Name', 'Selling Price', 'In Stock', 'EAN'],
    },
  ];

  const outputTemplates: OutputTemplate[] = [
    { marketplaceId: 'talabat', name: 'Talabat catalogue update', configured: true, columns: ['sku', 'name', 'price', 'active', 'maximumSalesQuantity', 'isWeighted', 'baseWeight', 'baseWeightUnit', 'pricePerBaseUnit', 'barcode 1', 'barcode 2', 'barcode 3', 'category 1'] },
    { marketplaceId: 'snoonu', name: 'Snoonu bulk update', configured: true, columns: ['Barcode(UniqueIdentifier)', 'Product Name (En)(ReadOnly)', 'SKU(ReadOnly)', 'Barcode(ReadOnly)', 'Price(Update)', 'Availability(Update)', 'Images(Custom)'] },
    { marketplaceId: 'rafeeq', name: 'Rafeeq stock & price update', configured: true, columns: ['Item ID', 'EAN', 'Item Name', 'Selling Price', 'In Stock'] },
    { marketplaceId: 'keeta', name: 'Keeta upload template', configured: false, columns: [] },
  ];

  const generatedFiles: GeneratedFile[] = [
    { id: 'gf-1', marketplaceId: 'talabat', kind: 'stock_price', fileName: 'Talabat_Update_05Oct2026_0912.xlsx', productCount: 11, generatedBy: 'Rahul Menon', generatedAt: '2026-10-05T09:12:00+03:00' },
    { id: 'gf-2', marketplaceId: 'snoonu', kind: 'stock_price', fileName: 'Snoonu_Update_05Oct2026_0915.xlsx', productCount: 9, generatedBy: 'Rahul Menon', generatedAt: '2026-10-05T09:15:00+03:00' },
    { id: 'gf-3', marketplaceId: 'rafeeq', kind: 'price', fileName: 'Rafeeq_Price_04Oct2026_1720.xlsx', productCount: 6, generatedBy: 'Omar Haddad', generatedAt: '2026-10-04T17:20:00+03:00' },
  ];

  const pepsi = byName('Pepsi 330ml Can');
  const activity: ActivityEntry[] = [
    { id: 'a1', at: '2026-10-05T18:40:00+03:00', productId: pepsi.id, source: 'Talabat file', field: 'Talabat price', oldValue: '2.75', newValue: '2.50', user: 'Rahul Menon' },
    { id: 'a2', at: '2026-10-05T18:05:00+03:00', productId: pepsi.id, source: 'ERP (RetailOne)', field: 'ERP stock', oldValue: '140', newValue: String(pepsi.erpStock), user: 'Omar Haddad' },
    { id: 'a3', at: '2026-10-02T11:20:00+03:00', productId: pepsi.id, source: 'Manual', field: 'Arabic name', oldValue: 'بيبسي', newValue: pepsi.nameAr, user: 'Aisha Rahman' },
    { id: 'a4', at: '2026-09-28T09:05:00+03:00', productId: pepsi.id, source: 'Manual', field: 'Talabat markup', oldValue: '8%', newValue: '10%', user: 'Rahul Menon' },
  ];

  return {
    version: DEMO_VERSION,
    now: DEMO_NOW,
    tenant: { name: 'Doha Fresh Markets', branch: 'Al Waab Branch', country: 'Qatar', currency: 'QAR', timezone: 'Asia/Qatar', erpName: 'RetailOne' },
    currentUser: team[0],
    team,
    marketplaces,
    categories,
    categoryMappings,
    products,
    listings,
    markups,
    uploads,
    inputTemplates,
    outputTemplates,
    generatedFiles,
    activity,
    settings: { priceTolerance: 0, roundingStep: 0.05, stockThreshold: 0, staleHours: 12 },
    pendingReview: null,
    onboarding: { step: 5, completedAt: '2026-10-05T09:12:00+03:00' },
  };
}

export function createEmptyState(): DemoState {
  const team: TeamMember[] = [
    { id: 'tm-1', name: 'Rahul Menon', email: 'rahul@dohafresh.qa', role: 'Catalogue Manager', status: 'Active' },
    { id: 'tm-2', name: 'Omar Haddad', email: 'omar@dohafresh.qa', role: 'Admin', status: 'Active' },
    { id: 'tm-3', name: 'Aisha Rahman', email: 'aisha@dohafresh.qa', role: 'Analyst', status: 'Active' },
  ];

  const marketplaces: Marketplace[] = [
    { id: 'talabat', name: 'Talabat', enabled: true, defaultMarkupPct: 10 },
    { id: 'snoonu', name: 'Snoonu', enabled: true, defaultMarkupPct: 8 },
    { id: 'rafeeq', name: 'Rafeeq', enabled: true, defaultMarkupPct: 5 },
    { id: 'keeta', name: 'Keeta', enabled: true, defaultMarkupPct: 0 },
  ];

  const categories: Category[] = CATEGORIES.map(({ id, nameEn, nameAr }) => ({ id, nameEn, nameAr }));
  const categoryMappings: CategoryMapping[] = [];
  for (const c of categories) {
    for (const m of marketplaces) {
      categoryMappings.push({ categoryId: c.id, marketplaceId: m.id, marketplaceCategory: MARKETPLACE_CATEGORIES[m.id][c.id] ?? null });
    }
  }

  const inputTemplates: InputTemplate[] = [
    {
      id: 'tpl-erp-retailone', source: 'erp', name: 'RetailOne item master (v3)', version: 3,
      fields: { barcode: 'ID', nameEn: 'Name*', nameAr: 'Arabic Name', category: 'Product Category Name', brand: 'Brand', price: 'Sale Price', cost: 'Cost Price', stock: 'Quantity', active: 'Active' },
      signature: ['ID', 'Name*', 'Sale Price', 'Quantity', 'Active'],
    },
    {
      id: 'tpl-talabat', source: 'talabat', name: 'Talabat catalogue export', version: 1,
      fields: { marketplaceProductId: 'sku', name: 'name', price: 'price', available: 'active', barcode1: 'barcode 1', barcode2: 'barcode 2', barcode3: 'barcode 3' },
      signature: ['sku', 'name', 'price', 'active', 'barcode 1'],
    },
    {
      id: 'tpl-snoonu', source: 'snoonu', name: 'Snoonu bulk update file', version: 1,
      fields: { marketplaceProductId: 'Barcode(UniqueIdentifier)', name: 'Product Name (En)(ReadOnly)', price: 'Price(Update)', available: 'Availability(Update)', barcode1: 'Barcode(ReadOnly)' },
      signature: ['Barcode(UniqueIdentifier)', 'Price(Update)', 'Availability(Update)'],
    },
    {
      id: 'tpl-rafeeq', source: 'rafeeq', name: 'Rafeeq product export', version: 1,
      fields: { marketplaceProductId: 'Item ID', name: 'Item Name', price: 'Selling Price', available: 'In Stock', barcode1: 'EAN' },
      signature: ['Item ID', 'Item Name', 'Selling Price', 'In Stock', 'EAN'],
    },
  ];

  const outputTemplates: OutputTemplate[] = [
    { marketplaceId: 'talabat', name: 'Talabat catalogue update', configured: true, columns: ['sku', 'name', 'price', 'active', 'maximumSalesQuantity', 'isWeighted', 'baseWeight', 'baseWeightUnit', 'pricePerBaseUnit', 'barcode 1', 'barcode 2', 'barcode 3', 'category 1'] },
    { marketplaceId: 'snoonu', name: 'Snoonu bulk update', configured: true, columns: ['Barcode(UniqueIdentifier)', 'Product Name (En)(ReadOnly)', 'SKU(ReadOnly)', 'Barcode(ReadOnly)', 'Price(Update)', 'Availability(Update)', 'Images(Custom)'] },
    { marketplaceId: 'rafeeq', name: 'Rafeeq stock & price update', configured: true, columns: ['Item ID', 'EAN', 'Item Name', 'Selling Price', 'In Stock'] },
    { marketplaceId: 'keeta', name: 'Keeta upload template', configured: false, columns: [] },
  ];

  return {
    version: DEMO_VERSION,
    now: DEMO_NOW,
    tenant: { name: 'Doha Fresh Markets', branch: 'Al Waab Branch', country: 'Qatar', currency: 'QAR', timezone: 'Asia/Qatar', erpName: 'RetailOne' },
    currentUser: team[0],
    team,
    marketplaces,
    categories,
    categoryMappings,
    products: [],
    listings: [],
    markups: [],
    uploads: [],
    inputTemplates,
    outputTemplates,
    generatedFiles: [],
    activity: [],
    settings: { priceTolerance: 0, roundingStep: 0.05, stockThreshold: 0, staleHours: 12 },
    pendingReview: null,
    onboarding: { step: 1, completedAt: null },
  };
}

function upload(id: string, source: UploadRecord['source'], fileName: string, kb: number, at: string, by: string, templateId: string, rows: number): UploadRecord {
  return {
    id, source, fileName, fileSizeKb: kb, contains: 'full', uploadedBy: by, uploadedAt: at, status: 'applied', templateId,
    summary: { rowsRead: rows, matched: rows, newProducts: 0, rowsWithErrors: 0, priceChanges: 0, stockChanges: 0, missingFromFile: 0 },
  };
}
