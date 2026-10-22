// Display helpers. All times are shown in Asia/Qatar, relative to the demo clock.
const TZ = 'Asia/Qatar';

export function money(n: number | null | undefined): string {
  return n === null || n === undefined || Number.isNaN(n) ? '—' : n.toFixed(2);
}

export function signedMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return (n > 0 ? '+' : '') + n.toFixed(2);
}

export function int(n: number): string {
  return n.toLocaleString('en-US');
}

/** "06 Oct 2026 09:12" */
export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  return `${date} ${time(iso)}`;
}

export function time(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}

function dayKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
}

/** "today 09:12", "yesterday 18:40", or "04 Oct 2026 17:20" relative to the demo clock. */
export function relative(iso: string | null | undefined, nowIso: string): string {
  if (!iso) return 'No file yet';
  const diffDays = Math.round((Date.parse(dayKey(nowIso)) - Date.parse(dayKey(iso))) / 86_400_000);
  if (diffDays === 0) return `today ${time(iso)}`;
  if (diffDays === 1) return `yesterday ${time(iso)}`;
  return dateTime(iso);
}
