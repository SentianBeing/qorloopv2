import { CategoryPriceRule, PriceRule, PricingSettings, Product } from '../types';

/**
 * Marketplace Price seed data for the demo.
 * One default rule applies to every marketplace (price parity). Category and
 * product rules override it.
 */
export const INITIAL_PRICING_SETTINGS: PricingSettings = {
  defaultRule: { mode: 'percent', value: 10 },
  rounding: 'Exact',
  perMarketplaceEnabled: false,
  // Advanced (off by default): the old per-marketplace markups, kept for the 1–2% of merchants who need them.
  marketplaceRules: {
    talabat: { markup: 20, rounding: '0.25', active: true },
    snoonu: { markup: 20, rounding: '0.25', active: true },
    rafeeq: { markup: 20, rounding: '0.50', active: true },
    keeta: { markup: 25, rounding: 'Exact', active: false },
  },
};

export const INITIAL_CATEGORY_PRICE_RULES: CategoryPriceRule[] = [
  { id: 'cpr-1', category: 'Fruits & Vegetables', rule: { mode: 'amount', value: 1 } },
  { id: 'cpr-2', category: 'Confectionery', rule: { mode: 'same', value: 0 } },
  { id: 'cpr-3', category: 'Cooking & Baking', rule: { mode: 'same', value: 0 } },
];

/** Product-level prices applied on top of INITIAL_PRODUCTS. */
export const PRODUCT_PRICE_SEED: Record<string, { priceRule?: PriceRule }> = {
  '987657': { priceRule: { mode: 'fixed', value: 1.9 } }, // Laban
  '987658': { priceRule: { mode: 'fixed', value: 3.5 } }, // Snickers
  '987660': { priceRule: { mode: 'same', value: 0 } }, // Coca-Cola 1.5L
  '987661': { priceRule: { mode: 'same', value: 0 } }, // Nescafe
  '987663': { priceRule: { mode: 'same', value: 0 } }, // Pringles
  '987664': { priceRule: { mode: 'fixed', value: 4.5 } }, // KitKat
  '987665': { priceRule: { mode: 'percent', value: 10 } }, // Oreo
  '987666': { priceRule: { mode: 'same', value: 0 } }, // Lurpak
};

/** Fresh produce for the weekly price-change story (ERP + 1.00 QAR category rule). */
export const PRODUCE_PRODUCTS: Product[] = [
  {
    id: '987670',
    sku: 'BAN-1KG',
    nameEn: 'Banana Philippines 1kg',
    nameAr: 'موز فلبيني ١ كجم',
    barcode: '2000000010017',
    category: 'Fruits & Vegetables',
    subcategory: 'Fresh Fruits',
    brand: 'Fresh',
    size: '1',
    unit: 'kg',
    packSize: 1,
    erpPrice: 5.5,
    costPrice: 4.2,
    defaultMarkup: 0,
    sellingPrice: 6.5,
    erpStock: 140,
    status: 'Active',
    createdAt: '01 Sep 2026 08:00',
    updatedAt: '06 Oct 2026 07:45',
    updatedBy: 'Omar Haddad',
    imageKey: 'banana',
    marketplaces: {
      talabat: { listed: true, price: 6.5, stock: 140, erpStock: 140, stockDiff: 0, lastUpdated: '05 Oct 2026 18:40', note: 'In sync' },
      snoonu: { listed: true, price: 6.5, stock: 140, erpStock: 140, stockDiff: 0, lastUpdated: '06 Oct 2026 08:55', note: 'In sync' },
      rafeeq: { listed: true, price: 6.5, stock: 140, erpStock: 140, stockDiff: 0, lastUpdated: '06 Oct 2026 07:30', note: 'In sync' },
      keeta: { listed: false, note: 'No file uploaded yet' },
    },
  },
  {
    id: '987671',
    sku: 'TOM-1KG',
    nameEn: 'Tomato Local 1kg',
    nameAr: 'طماطم محلية ١ كجم',
    barcode: '2000000010024',
    category: 'Fruits & Vegetables',
    subcategory: 'Fresh Vegetables',
    brand: 'Fresh',
    size: '1',
    unit: 'kg',
    packSize: 1,
    erpPrice: 4,
    costPrice: 3,
    defaultMarkup: 0,
    sellingPrice: 5,
    erpStock: 90,
    status: 'Active',
    createdAt: '01 Sep 2026 08:00',
    updatedAt: '06 Oct 2026 07:45',
    updatedBy: 'Omar Haddad',
    imageKey: 'tomato',
    marketplaces: {
      talabat: { listed: true, price: 5, stock: 90, erpStock: 90, stockDiff: 0, lastUpdated: '05 Oct 2026 18:40', note: 'In sync' },
      snoonu: { listed: true, price: 5, stock: 90, erpStock: 90, stockDiff: 0, lastUpdated: '06 Oct 2026 08:55', note: 'In sync' },
      rafeeq: { listed: true, price: 4.5, stock: 90, erpStock: 90, stockDiff: 0, lastUpdated: '06 Oct 2026 07:30', note: 'Price mismatch' },
      keeta: { listed: false, note: 'No file uploaded yet' },
    },
  },
];
