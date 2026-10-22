/** Expected marketplace price = ERP selling price + markup, rounded to the nearest step (default 0.05 QAR). */
export function expectedPrice(erpPrice: number, markupPct: number, step = 0.05): number {
  const raw = erpPrice * (1 + markupPct / 100);
  const precise = Math.round(raw * 1000) / 1000; // kill float noise (5.5 * 1.15 = 6.3249999)
  const rounded = Math.round(precise / step) * step;
  return Math.round(rounded * 100) / 100;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Strip spaces and leading zeros so GTIN-13 and zero-padded GTIN-14 compare equal. */
export function normalizeBarcode(barcode: string | number | null | undefined): string {
  if (barcode === null || barcode === undefined) return '';
  return String(barcode).trim().replace(/\.0+$/, '').replace(/^0+/, '');
}
