// Excel read/write in the browser (SheetJS).
import * as XLSX from 'xlsx';
import { SheetRow } from './uploads';

export interface SheetData {
  sheetName: string;
  headers: string[];
  rows: SheetRow[];
}

/** Read the first sheet that has data. Works for .xlsx, .xls and .csv. */
export async function readSpreadsheet(file: File | ArrayBuffer): Promise<SheetData> {
  const buf = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<SheetRow>(ws, { defval: null, raw: true });
    const nonEmpty = rows.filter((r) => Object.values(r).some((v) => v !== null && v !== ''));
    if (!nonEmpty.length) continue;
    const headerRow = (XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })[0] ?? []).map((h) => String(h ?? '').trim());
    return { sheetName: name, headers: headerRow.filter(Boolean), rows: nonEmpty };
  }
  return { sheetName: wb.SheetNames[0] ?? '', headers: [], rows: [] };
}

/** Fetch one of the bundled sample files from /public/samples. */
export async function readSample(path: string): Promise<{ data: SheetData; sizeKb: number }> {
  const res = await fetch(path);
  const buf = await res.arrayBuffer();
  return { data: await readSpreadsheet(buf), sizeKb: Math.max(1, Math.round(buf.byteLength / 1024)) };
}

export function downloadXlsx(fileName: string, columns: string[], rows: Record<string, unknown>[], format: 'xlsx' | 'csv' = 'xlsx') {
  const ws = XLSX.utils.json_to_sheet(rows, { header: columns });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const name = format === 'csv' ? fileName.replace(/\.xlsx$/, '.csv') : fileName;
  XLSX.writeFile(wb, name, { bookType: format });
}
