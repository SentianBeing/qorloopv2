// Generates the walkthrough sample files in public/samples from the demo seed.
// Run: npx tsx scripts/make-samples.ts
import * as XLSX from 'xlsx';
import { mkdirSync } from 'node:fs';
import { createSeed, barcodeFor, makeProduct } from '../src/demo/seed';
import { CATALOG, CATEGORIES, DROPPED_IN_TODAYS_ERP, NEW_IN_SEED, NEW_IN_TODAYS_ERP } from '../src/demo/catalogData';
import { expectedPrice } from '../src/demo/pricing';

const OUT = 'public/samples';
mkdirSync(OUT, { recursive: true });
const s = createSeed();
const byName = (n: string) => s.products.find((p) => p.nameEn === n)!;

function write(file: string, rows: Record<string, unknown>[], header: string[], sheet = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(rows, { header });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, `${OUT}/${file}`);
  console.log(`${file}: ${rows.length} rows`);
}

// ---------- ERP: today's RetailOne item master ----------
const priceChanges: Record<string, number> = {
  'Baladna Fresh Milk 1L': 7.25, 'Nescafe Classic 200g': 18.5,
  'Al Alali Tuna Sunflower Oil 170g': 6.5, 'Abu Kass Basmati Rice 5kg': 41.0, 'Nutella 350g': 21.0,
  'Tide Powder Detergent 2.5kg': 30.5, 'Lusine Sliced White Bread 600g': 6.25,
};
const stockOverrides: Record<string, number> = { 'Al Ain Water 1.5L': 0, 'Tang Orange 375g': 0, 'Nutella 350g': 40, 'Baladna Fresh Milk 1L': 45 };

const erpHeader = ['ID', 'Product Reference', 'Name*', 'UOM*', 'Product Category Name', 'Brand', 'Sale Price', 'Purchase Price', 'Cost Price', 'Arabic Name', 'Quantity', 'Active'];
let seedRnd = 7;
const rnd = () => ((seedRnd = (seedRnd * 9301 + 49297) % 233280) / 233280);
const erpRows: Record<string, unknown>[] = [];
for (const p of s.products) {
  if (DROPPED_IN_TODAYS_ERP.includes(p.nameEn)) continue;
  const stock = stockOverrides[p.nameEn] ?? Math.max(0, p.erpStock + Math.round((rnd() - 0.55) * 40));
  erpRows.push({
    ID: p.barcode, 'Product Reference': p.sku, 'Name*': p.nameEn, 'UOM*': 'PCS', 'Product Category Name': p.erpCategory,
    Brand: p.brand, 'Sale Price': priceChanges[p.nameEn] ?? p.erpPrice, 'Purchase Price': p.costPrice, 'Cost Price': p.costPrice,
    'Arabic Name': p.status === 'new' ? null : p.nameAr, Quantity: stock, Active: p.erpActive ? 'Yes' : 'No',
  });
}
NEW_IN_TODAYS_ERP.forEach((t, j) => {
  const p = makeProduct(t, CATALOG.length + NEW_IN_SEED.length + j, rnd, 'new', s.now);
  erpRows.push({
    ID: p.barcode, 'Product Reference': p.sku, 'Name*': p.nameEn, 'UOM*': 'PCS',
    'Product Category Name': CATEGORIES.find((c) => c.id === t[4])!.erpName, Brand: p.brand, 'Sale Price': p.erpPrice,
    'Purchase Price': p.costPrice, 'Cost Price': p.costPrice, 'Arabic Name': j % 2 === 0 ? p.nameAr : null,
    Quantity: 24 + j * 6, Active: 'Yes',
  });
});
// Two broken rows so the review shows "rows with errors".
erpRows.push({ ID: barcodeFor('Broken row A', 900), 'Product Reference': 'DFM-99001', 'Name*': 'Almarai Cheese Triangles 8s', 'UOM*': 'PCS', 'Product Category Name': 'DAIRY', Brand: 'Almarai', 'Sale Price': 'N/A', 'Purchase Price': 4.1, 'Cost Price': 4.1, 'Arabic Name': null, Quantity: 30, Active: 'Yes' });
erpRows.push({ ID: null, 'Product Reference': 'DFM-99002', 'Name*': 'Fresh Lemons 500g', 'UOM*': 'PCS', 'Product Category Name': 'FRESH PRODUCE', Brand: 'Fresh', 'Sale Price': 4.5, 'Purchase Price': 3.0, 'Cost Price': 3.0, 'Arabic Name': null, Quantity: 18, Active: 'Yes' });
write('Item_Master_06Oct2026.xlsx', erpRows, erpHeader, 'Item_Master');

// ---------- Marketplace files ----------
const listingsFor = (mp: string) => s.listings.filter((l) => l.marketplaceId === mp);
const product = (id: string) => s.products.find((p) => p.id === id)!;

// Talabat (today): Baladna fixed, Pepsi still wrong, two new problems.
const talabatChanges: Record<string, { price?: number; available?: boolean }> = {
  'Baladna Fresh Milk 1L': { available: true },
  "Lay's Salted 170g": { price: 9.0 },
  'Twix 50g': { available: false },
};
write('talabat_items_06Oct.xlsx', listingsFor('talabat').map((l) => {
  const p = product(l.productId);
  const c = talabatChanges[p.nameEn] ?? {};
  return {
    sku: l.marketplaceProductId, name: p.nameEn, price: String(c.price ?? l.price), active: c.available ?? l.available,
    maximumSalesQuantity: null, isWeighted: false, baseWeight: null, baseWeightUnit: null, pricePerBaseUnit: null,
    'barcode 1': p.barcode.padStart(14, '0'), 'barcode 2': null, 'barcode 3': null, 'category 1': s.categoryMappings.find((m) => m.marketplaceId === 'talabat' && m.categoryId === p.categoryId)?.marketplaceCategory ?? null,
  };
}), ['sku', 'name', 'price', 'active', 'maximumSalesQuantity', 'isWeighted', 'baseWeight', 'baseWeightUnit', 'pricePerBaseUnit', 'barcode 1', 'barcode 2', 'barcode 3', 'category 1'], 'Talabat Format');

// Snoonu (today): same as this morning, with one row the catalogue doesn't know (unmatched).
const sn = listingsFor('snoonu').map((l) => {
  const p = product(l.productId);
  return { 'Barcode(UniqueIdentifier)': l.marketplaceProductId, 'Product Name (En)(ReadOnly)': p.nameEn, 'SKU(ReadOnly)': p.sku, 'Barcode(ReadOnly)': p.barcode, 'Price(Update)': l.price.toFixed(2), 'Availability(Update)': l.available ? 'True' : 'False', 'Images(Custom)': '' };
});
sn.push({ 'Barcode(UniqueIdentifier)': '6682', 'Product Name (En)(ReadOnly)': 'Gift Card QAR 50', 'SKU(ReadOnly)': '6682', 'Barcode(ReadOnly)': '6682', 'Price(Update)': '50.00', 'Availability(Update)': 'True', 'Images(Custom)': '' });
write('snoonu_products_06Oct.xlsx', sn, ['Barcode(UniqueIdentifier)', 'Product Name (En)(ReadOnly)', 'SKU(ReadOnly)', 'Barcode(ReadOnly)', 'Price(Update)', 'Availability(Update)', 'Images(Custom)'], 'Snoonu Format');

// Rafeeq (today)
write('rafeeq_catalogue_06Oct.xlsx', listingsFor('rafeeq').map((l) => {
  const p = product(l.productId);
  return { 'Item ID': l.marketplaceProductId, EAN: p.barcode, 'Item Name': p.nameEn, 'Selling Price': l.price, 'In Stock': l.available ? 'Yes' : 'No' };
}), ['Item ID', 'EAN', 'Item Name', 'Selling Price', 'In Stock'], 'Products');

// Keeta (first ever file, unknown layout → mapping screen). Lists 40 products, a few priced wrong.
const keetaRows = s.products.filter((p) => p.status === 'active').slice(0, 40).map((p, i) => {
  const exp = expectedPrice(p.erpPrice, 12);
  const wrong = [2, 7, 15, 22].includes(i);
  return { 'Item Code': `KT${100200 + i}`, 'Item Name (EN)': p.nameEn, 'Item Name (AR)': p.nameAr, GTIN: p.barcode, 'Menu Price': wrong ? +(exp - 0.5).toFixed(2) : exp, Status: i === 30 ? 'Sold out' : 'Available' };
});
write('keeta_menu_export_06Oct.xlsx', keetaRows, ['Item Code', 'Item Name (EN)', 'Item Name (AR)', 'GTIN', 'Menu Price', 'Status'], 'Menu');
console.log('Pepsi expected on Talabat:', expectedPrice(byName('Pepsi 330ml Can').erpPrice, 10));
