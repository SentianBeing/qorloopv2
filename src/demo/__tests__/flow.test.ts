import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createSeed, createEmptyState } from '../seed';
import { expectedPrice, normalizeBarcode } from '../pricing';
import { summarize, rowsForProduct, stockMismatches, priceMismatches, needsAttention } from '../recon';
import { applyReview, buildReview, parseUpload, saveTemplate, suggestMapping } from '../uploads';
import { previewFile, simulateMarketplaceAccepted } from '../exports';
import { readSpreadsheet } from '../xlsxIO';
import { DemoState, SourceId } from '../types';

async function sample(name: string) {
  const b = readFileSync('public/samples/' + name);
  return readSpreadsheet(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer);
}

async function upload(s: DemoState, source: SourceId, file: string) {
  const d = await sample(file);
  const parsed = parseUpload(s, source, file, 100, 'full', d.headers, d.rows);
  return { parsed, d };
}

describe('pricing', () => {
  it('applies markup and rounds to 0.05', () => {
    expect(expectedPrice(2.5, 10)).toBe(2.75);
    expect(expectedPrice(2.5, 8)).toBe(2.7);
    expect(expectedPrice(8.5, 10)).toBe(9.35);
    expect(expectedPrice(3.25, 8)).toBe(3.5);
  });
  it('treats zero-padded GTIN-14 as the same barcode', () => {
    expect(normalizeBarcode('06281007012345')).toBe(normalizeBarcode('6281007012345'));
  });
});

describe('seed', () => {
  const s = createSeed();
  const sum = summarize(s);
  it('has consistent numbers', () => {
    console.log('SEED', Object.values(sum).map((m) => `${m.name}: ${m.total} (${m.stock} stock, ${m.price} price) listed ${m.listed} notListed ${m.notListed} stale ${m.isStale}`).join(' | '));
    expect(sum.keeta.hasData).toBe(false);
    expect(sum.keeta.total).toBe(0);
    expect(sum.talabat.isStale).toBe(true);
    expect(sum.snoonu.isStale).toBe(false);
    expect(sum.talabat.total).toBe(sum.talabat.stock + sum.talabat.price);
    expect(stockMismatches(s, 'talabat').length).toBe(sum.talabat.stock);
    expect(priceMismatches(s, 'talabat').length).toBe(sum.talabat.price);
  });
  it('tells the Pepsi story', () => {
    const pepsi = s.products.find((p) => p.nameEn === 'Pepsi 330ml Can')!;
    const rows = rowsForProduct(s, pepsi.id);
    const t = rows.find((r) => r.marketplaceId === 'talabat')!;
    expect(t.expectedPrice).toBe(2.75);
    expect(t.actualPrice).toBe(2.5);
    expect(t.priceMismatch).toBe(true);
    expect(rows.find((r) => r.marketplaceId === 'rafeeq')!.status).toBe('in_sync');
    expect(rows.find((r) => r.marketplaceId === 'keeta')!.status).toBe('no_data');
  });
  it('lists needs-attention items', () => {
    console.log('ATTENTION', needsAttention(s).map((a) => a.title).join(' | '));
    expect(needsAttention(s).length).toBeGreaterThan(1);
  });
});

describe('daily loop', () => {
  it('ERP upload → review → apply', async () => {
    let s = createSeed();
    const { parsed } = await upload(s, 'erp', 'Item_Master_06Oct2026.xlsx');
    expect(parsed.templateId).toBe('tpl-erp-retailone');
    const r = buildReview(s, parsed);
    console.log('ERP REVIEW', JSON.stringify(r.summary), 'missing:', r.missing.map((m) => m.nameEn).join(', '), 'errors:', r.errors.map((e) => e.reason).join(', '));
    expect(r.newProducts.length).toBe(6);
    expect(r.missing.length).toBe(2);
    expect(r.errors.length).toBe(2);
    expect(r.priceChanges.length).toBeGreaterThanOrEqual(7);
    s = applyReview(s, r);
    expect(s.products.filter((p) => p.status === 'new').length).toBe(9);
    const sum = summarize(s);
    expect(sum.talabat.missingFromErp).toBe(2);
    // Nescafe ERP price went 18.00 → 18.50, Talabat still 17.50, expected now 20.35
    const nes = rowsForProduct(s, s.products.find((p) => p.nameEn === 'Nescafe Classic 200g')!.id).find((x) => x.marketplaceId === 'talabat')!;
    expect(nes.expectedPrice).toBe(20.35);
  });

  it('Talabat upload refreshes listings', async () => {
    let s = createSeed();
    const before = summarize(s).talabat;
    const { parsed } = await upload(s, 'talabat', 'talabat_items_06Oct.xlsx');
    expect(parsed.templateId).toBe('tpl-talabat');
    const r = buildReview(s, parsed);
    console.log('TALABAT REVIEW', JSON.stringify(r.summary));
    s = applyReview(s, r);
    const after = summarize(s).talabat;
    console.log('TALABAT before', before.total, 'after', after.total, 'stale', after.isStale);
    expect(after.isStale).toBe(false);
    const baladna = rowsForProduct(s, s.products.find((p) => p.nameEn === 'Baladna Fresh Milk 1L')!.id).find((x) => x.marketplaceId === 'talabat')!;
    expect(baladna.stockIssue).toBeNull();
  });

  it('Snoonu upload reports an unmatched row', async () => {
    const s = createSeed();
    const { parsed } = await upload(s, 'snoonu', 'snoonu_products_06Oct.xlsx');
    const r = buildReview(s, parsed);
    expect(r.unmatched.length).toBe(1);
  });

  it('Keeta first upload needs mapping, then works', async () => {
    let s = createSeed();
    const { parsed, d } = await upload(s, 'keeta', 'keeta_menu_export_06Oct.xlsx');
    expect(parsed.templateId).toBeNull();
    const sug = suggestMapping('keeta', d.headers);
    console.log('KEETA SUGGESTED', JSON.stringify(sug));
    expect(sug.barcode1).toBe('GTIN');
    expect(sug.price).toBe('Menu Price');
    expect(sug.available).toBe('Status');
    const saved = saveTemplate(s, 'keeta', 'Keeta menu export', sug, d.headers);
    s = saved.state;
    const p2 = parseUpload(s, 'keeta', 'k.xlsx', 10, 'full', d.headers, d.rows, { templateId: saved.templateId, fields: sug });
    s = applyReview(s, buildReview(s, p2));
    const k = summarize(s).keeta;
    console.log('KEETA after', JSON.stringify({ total: k.total, stock: k.stock, price: k.price, listed: k.listed, notListed: k.notListed }));
    expect(k.hasData).toBe(true);
    expect(k.price).toBe(4);
    // next time it's recognised automatically
    const again = parseUpload(s, 'keeta', 'k2.xlsx', 10, 'full', d.headers, d.rows);
    expect(again.templateId).toBe(saved.templateId);
  });

  it('markup change recalculates mismatches live', () => {
    const s = createSeed();
    const before = summarize(s).talabat.price;
    const s2: DemoState = { ...s, marketplaces: s.marketplaces.map((m) => (m.id === 'talabat' ? { ...m, defaultMarkupPct: 0 } : m)) };
    expect(summarize(s2).talabat.price).toBeGreaterThan(before);
  });

  it('generate file → marketplace accepts → in sync', () => {
    let s = createSeed();
    const prev = previewFile(s, 'talabat', 'stock_price', 'mismatches');
    console.log('TALABAT FILE', prev.fileName, prev.productCount, JSON.stringify(prev.largestPriceChange), JSON.stringify(prev.sheetRows[0]));
    expect(prev.productCount).toBe(summarize(s).talabat.productsWithIssues);
    expect(prev.blockedReason).toBeNull();
    s = simulateMarketplaceAccepted(s, prev);
    expect(summarize(s).talabat.total).toBe(0);
    expect(previewFile(s, 'keeta', 'price', 'mismatches').blockedReason).not.toBeNull();
  });

  it('new products file needs category mapping', () => {
    const s = createSeed();
    const s2: DemoState = { ...s, products: s.products.map((p) => (p.status === 'new' ? { ...p, status: 'active', nameAr: p.nameAr || 'x' } : p)) };
    const t = previewFile(s2, 'talabat', 'new_products', 'mismatches');
    expect(t.productCount).toBe(3);
    expect(t.blockedReason).toBeNull();
  });
});

describe('onboarding & empty state', () => {
  it('createEmptyState creates a clean starting state', () => {
    const empty = createEmptyState();
    expect(empty.onboarding.step).toBe(1);
    expect(empty.onboarding.completedAt).toBeNull();
    expect(empty.products).toHaveLength(0);
    expect(empty.listings).toHaveLength(0);
    expect(empty.uploads).toHaveLength(0);
    expect(empty.generatedFiles).toHaveLength(0);
    expect(empty.activity).toHaveLength(0);
    expect(empty.marketplaces).toHaveLength(4);
    expect(empty.inputTemplates.length).toBeGreaterThan(0);
    expect(empty.outputTemplates.length).toBeGreaterThan(0);
  });

  it('first ERP import marks products as active directly', async () => {
    let empty = createEmptyState();
    const { parsed } = await upload(empty, 'erp', 'Item_Master_06Oct2026.xlsx');
    const review = buildReview(empty, parsed);
    empty = applyReview(empty, review);

    expect(empty.products.length).toBeGreaterThan(0);
    // All newly imported products on first import must be 'active'
    expect(empty.products.every((p) => p.status === 'active')).toBe(true);

    // Now test a second ERP import: subsequent imports must leave new products as 'new'
    const newErpRow = {
      barcode: '9999999999999',
      nameEn: 'Brand New Product',
      price: 15,
      stock: 50,
      active: true,
    };
    const parsed2 = {
      ...parsed,
      erpRows: [...(parsed.erpRows ?? []), newErpRow],
    };
    const review2 = buildReview(empty, parsed2);
    const updated = applyReview(empty, review2);
    const brandNew = updated.products.find((p) => p.barcode === '9999999999999');
    expect(brandNew).toBeDefined();
    expect(brandNew?.status).toBe('new');
  });

  it('disabled marketplaces are skipped in summarize and attention', () => {
    let s = createSeed();
    expect(summarize(s).rafeeq).toBeDefined();

    // Disable rafeeq
    s = {
      ...s,
      marketplaces: s.marketplaces.map((m) => (m.id === 'rafeeq' ? { ...m, enabled: false } : m)),
    };
    const sum = summarize(s);
    expect(sum.rafeeq).toBeUndefined();
    expect(sum.talabat).toBeDefined();

    const attention = needsAttention(s);
    expect(attention.some((a) => a.title.includes('Rafeeq'))).toBe(false);
  });
});
