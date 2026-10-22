// Demo "database" + actions, persisted in localStorage. Wrap the app in <DemoProvider> and use useDemo().
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createSeed, createEmptyState, DEMO_VERSION } from './seed';
import { needsAttention, summarize, AttentionItem, MarketplaceSummary } from './recon';
import { applyReview, buildReview, parseUpload, saveTemplate, SheetRow, suggestMapping, updateTemplate } from './uploads';
import { FileKind, FilePreview, FileScope, previewFile, recordGenerated, simulateMarketplaceAccepted } from './exports';
import { downloadXlsx, readSample, readSpreadsheet } from './xlsxIO';
import { DemoState, MarketplaceId, PendingReview, Product, SourceId, TeamMember, Tenant } from './types';

const STORAGE_KEY = 'shelf-demo-state';

/** Sample files shipped in /public/samples for the walkthrough. */
export const SAMPLE_FILES: { source: SourceId; label: string; path: string; note: string }[] = [
  { source: 'erp', label: 'Item_Master_06Oct2026.xlsx', path: '/samples/Item_Master_06Oct2026.xlsx', note: "Today's ERP export: price and stock changes, 6 new products, 2 dropped" },
  { source: 'talabat', label: 'talabat_items_06Oct.xlsx', path: '/samples/talabat_items_06Oct.xlsx', note: "Today's Talabat catalogue export" },
  { source: 'snoonu', label: 'snoonu_products_06Oct.xlsx', path: '/samples/snoonu_products_06Oct.xlsx', note: "Today's Snoonu bulk-update file" },
  { source: 'rafeeq', label: 'rafeeq_catalogue_06Oct.xlsx', path: '/samples/rafeeq_catalogue_06Oct.xlsx', note: "Today's Rafeeq export" },
  { source: 'keeta', label: 'keeta_menu_export_06Oct.xlsx', path: '/samples/keeta_menu_export_06Oct.xlsx', note: 'First Keeta file: new layout, needs column mapping' },
];

/** A file that was read but whose layout is unknown, waiting on the mapping screen. */
export interface PendingMapping {
  source: SourceId;
  fileName: string;
  fileSizeKb: number;
  contains: 'full' | 'partial';
  headers: string[];
  rows: SheetRow[];
  suggested: Record<string, string>;
  /** Set when the user is editing a saved mapping from the Templates page (no upload review follows). */
  editingTemplateId?: string;
  templateName?: string;
  /** Opened from the File mapping page with the sample file: save the mapping only, no upload review. */
  fromFileMapping?: boolean;
}

export type UploadResult = { next: 'review' } | { next: 'mapping' } | { next: 'error'; message: string };

interface DemoApi {
  state: DemoState;
  summary: Record<MarketplaceId, MarketplaceSummary>;
  attention: AttentionItem[];
  pendingMapping: PendingMapping | null;
  pendingReview: PendingReview | null;
  // uploads
  uploadFile: (source: SourceId, file: File, contains?: 'full' | 'partial') => Promise<UploadResult>;
  uploadSample: (source: SourceId, contains?: 'full' | 'partial') => Promise<UploadResult>;
  /** Returns 'review' after a first-time upload mapping, 'saved' when editing a saved mapping. */
  completeMapping: (fields: Record<string, string>, templateName: string) => 'review' | 'saved';
  /** Open the column-mapping screen for a source to view or change how its file is read. */
  editMapping: (source: SourceId) => Promise<UploadResult>;
  cancelMapping: () => void;
  confirmReview: () => void;
  discardReview: () => void;
  // catalogue & pricing
  setMarketplaceMarkup: (mp: MarketplaceId, pct: number) => void;
  setProductMarkup: (productId: string, mp: MarketplaceId, pct: number | null) => void;
  updateProduct: (productId: string, patch: Partial<Pick<Product, 'nameAr' | 'categoryId' | 'imageKey' | 'status'>>) => void;
  activateProducts: (productIds: string[]) => { activated: number; skipped: string[] };
  setCategoryMapping: (categoryId: string, mp: MarketplaceId, value: string | null) => void;
  configureOutputTemplate: (mp: MarketplaceId) => void;
  // files
  preview: (mp: MarketplaceId, kind: FileKind, scope: FileScope) => FilePreview;
  generate: (preview: FilePreview, format?: 'xlsx' | 'csv') => void;
  redownload: (fileId: string) => void;
  markAcceptedByMarketplace: (preview: FilePreview) => void;
  // onboarding & tenant
  setTenant: (patch: Partial<Tenant>) => void;
  setMarketplaceEnabled: (mp: MarketplaceId, enabled: boolean) => void;
  setOnboardingStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  completeOnboarding: () => void;
  inviteTeamMember: (email: string, role: TeamMember['role']) => void;
  applyDirectReview: (review: PendingReview) => void;
  saveCustomTemplate: (source: SourceId, name: string, fields: Record<string, string>, headers: string[]) => string;
  // demo controls
  startNewCustomer: () => void;
  resetDemo: () => void;
}

const Ctx = createContext<DemoApi | null>(null);

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as DemoState;
      if (s.version === DEMO_VERSION) return s;
    }
  } catch { /* ignore */ }
  return createSeed();
}

function advance(iso: string, minutes: number): string {
  const d = new Date(Date.parse(iso) + minutes * 60_000);
  // keep the +03:00 offset in storage
  const q = new Date(d.getTime() + 3 * 3_600_000).toISOString().slice(0, 19);
  return q + '+03:00';
}

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DemoState>(load);
  const [pendingMapping, setPendingMapping] = useState<PendingMapping | null>(null);
  const previews = useRef(new Map<string, FilePreview>());

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const summary = useMemo(() => summarize(state), [state]);
  const attention = useMemo(() => needsAttention(state), [state]);

  const ingest = useCallback((source: SourceId, fileName: string, sizeKb: number, contains: 'full' | 'partial', headers: string[], rows: SheetRow[]): UploadResult => {
    if (!rows.length) return { next: 'error', message: 'The file has no rows.' };
    const parsed = parseUpload(state, source, fileName, sizeKb, contains, headers, rows);
    if (!parsed.templateId) {
      setPendingMapping({ source, fileName, fileSizeKb: sizeKb, contains, headers, rows, suggested: suggestMapping(source, headers) });
      return { next: 'mapping' };
    }
    const review = buildReview(state, parsed);
    setState((s) => ({ ...s, pendingReview: review }));
    return { next: 'review' };
  }, [state]);

  const uploadFile: DemoApi['uploadFile'] = async (source, file, contains = 'full') => {
    if (file.size > 25 * 1024 * 1024) return { next: 'error', message: 'File is larger than 25 MB.' };
    const data = await readSpreadsheet(file);
    return ingest(source, file.name, Math.max(1, Math.round(file.size / 1024)), contains, data.headers, data.rows);
  };

  const uploadSample: DemoApi['uploadSample'] = async (source, contains = 'full') => {
    const sample = SAMPLE_FILES.find((f) => f.source === source);
    if (!sample) return { next: 'error', message: 'No sample file for this source.' };
    const { data, sizeKb } = await readSample(sample.path);
    return ingest(source, sample.label, sizeKb, contains, data.headers, data.rows);
  };

  const completeMapping: DemoApi['completeMapping'] = (fields, templateName) => {
    if (!pendingMapping) return 'saved';
    if (pendingMapping.editingTemplateId) {
      setState(updateTemplate(state, pendingMapping.editingTemplateId, templateName, fields, pendingMapping.headers));
      setPendingMapping(null);
      return 'saved';
    }
    const { state: s2, templateId } = saveTemplate(state, pendingMapping.source, templateName, fields, pendingMapping.headers);
    if (pendingMapping.fromFileMapping) {
      setState(s2);
      setPendingMapping(null);
      return 'saved';
    }
    const parsed = parseUpload(s2, pendingMapping.source, pendingMapping.fileName, pendingMapping.fileSizeKb, pendingMapping.contains, pendingMapping.headers, pendingMapping.rows, { templateId, fields });
    setState({ ...s2, pendingReview: buildReview(s2, parsed) });
    setPendingMapping(null);
    return 'review';
  };

  const editMapping: DemoApi['editMapping'] = async (source) => {
    const sample = SAMPLE_FILES.find((f) => f.source === source);
    if (!sample) return { next: 'error', message: 'No sample file for this source.' };
    const { data, sizeKb } = await readSample(sample.path);
    const tpl = [...state.inputTemplates].reverse().find((t) => t.source === source);
    // Only keep saved columns that exist in the file; suggest the rest.
    const saved = tpl ? Object.fromEntries(Object.entries(tpl.fields).filter(([, h]) => data.headers.includes(h))) : {};
    setPendingMapping({
      source, fileName: sample.label, fileSizeKb: sizeKb, contains: 'full', headers: data.headers, rows: data.rows,
      suggested: { ...suggestMapping(source, data.headers), ...saved },
      editingTemplateId: tpl?.id, templateName: tpl?.name, fromFileMapping: true,
    });
    return { next: 'mapping' };
  };

  const confirmReview = () => setState((s) => (s.pendingReview ? { ...applyReview({ ...s, now: advance(s.now, 2) }, s.pendingReview) } : s));
  const discardReview = () => setState((s) => ({ ...s, pendingReview: null }));

  const setMarketplaceMarkup: DemoApi['setMarketplaceMarkup'] = (mp, pct) =>
    setState((s) => ({ ...s, marketplaces: s.marketplaces.map((m) => (m.id === mp ? { ...m, defaultMarkupPct: pct } : m)) }));

  const setProductMarkup: DemoApi['setProductMarkup'] = (productId, mp, pct) =>
    setState((s) => {
      const rest = s.markups.filter((m) => !(m.productId === productId && m.marketplaceId === mp));
      return { ...s, markups: pct === null ? rest : [...rest, { productId, marketplaceId: mp, markupPct: pct }] };
    });

  const updateProduct: DemoApi['updateProduct'] = (productId, patch) =>
    setState((s) => ({ ...s, products: s.products.map((p) => (p.id === productId ? { ...p, ...patch, updatedAt: s.now, updatedBy: s.currentUser.name } : p)) }));

  const activateProducts: DemoApi['activateProducts'] = (ids) => {
    const targets = state.products.filter((p) => ids.includes(p.id));
    const skipped = targets.filter((p) => !p.nameAr || !p.categoryId).map((p) => p.nameEn);
    const ok = new Set(targets.filter((p) => p.nameAr && p.categoryId).map((p) => p.id));
    setState((s) => ({
      ...s,
      products: s.products.map((p) => (ok.has(p.id) ? { ...p, status: 'active', updatedAt: s.now, updatedBy: s.currentUser.name } : p)),
    }));
    return { activated: ok.size, skipped };
  };

  const setCategoryMapping: DemoApi['setCategoryMapping'] = (categoryId, mp, value) =>
    setState((s) => ({ ...s, categoryMappings: s.categoryMappings.map((c) => (c.categoryId === categoryId && c.marketplaceId === mp ? { ...c, marketplaceCategory: value } : c)) }));

  const configureOutputTemplate: DemoApi['configureOutputTemplate'] = (mp) =>
    setState((s) => ({
      ...s,
      outputTemplates: s.outputTemplates.map((t) => (t.marketplaceId === mp ? { ...t, configured: true, columns: t.columns.length ? t.columns : ['barcode', 'name', 'name_ar', 'price', 'available'] } : t)),
    }));

  const preview: DemoApi['preview'] = (mp, kind, scope) => {
    const p = previewFile(state, mp, kind, scope);
    previews.current.set(p.fileName, p);
    return p;
  };

  const generate: DemoApi['generate'] = (p, format = 'xlsx') => {
    downloadXlsx(p.fileName, p.columns, p.sheetRows, format);
    setState((s) => recordGenerated(s, p).state);
  };

  const redownload: DemoApi['redownload'] = (fileId) => {
    const f = state.generatedFiles.find((g) => g.id === fileId);
    if (!f) return;
    const cached = previews.current.get(f.fileName);
    const p = cached ?? previewFile(state, f.marketplaceId, f.kind as FileKind, 'mismatches');
    downloadXlsx(f.fileName, p.columns, p.sheetRows);
  };

  const markAcceptedByMarketplace: DemoApi['markAcceptedByMarketplace'] = (p) => setState((s) => simulateMarketplaceAccepted(s, p));

  const setTenant: DemoApi['setTenant'] = (patch) =>
    setState((s) => ({ ...s, tenant: { ...s.tenant, ...patch } }));

  const setMarketplaceEnabled: DemoApi['setMarketplaceEnabled'] = (mp, enabled) =>
    setState((s) => ({
      ...s,
      marketplaces: s.marketplaces.map((m) => (m.id === mp ? { ...m, enabled } : m)),
    }));

  const setOnboardingStep: DemoApi['setOnboardingStep'] = (step) =>
    setState((s) => ({ ...s, onboarding: { ...s.onboarding, step } }));

  const inviteTeamMember: DemoApi['inviteTeamMember'] = (email, role) =>
    setState((s) =>
      s.team.some((t) => t.email.toLowerCase() === email.toLowerCase())
        ? s
        : { ...s, team: [...s.team, { id: 'tm-' + (s.team.length + 1) + '-' + Math.random().toString(36).slice(2, 6), name: email.split('@')[0], email, role, status: 'Invited' }] },
    );

  const completeOnboarding: DemoApi['completeOnboarding'] = () =>
    setState((s) => ({ ...s, onboarding: { step: 5, completedAt: s.now } }));

  const applyDirectReview: DemoApi['applyDirectReview'] = (review) => {
    setState((s) => applyReview({ ...s, now: advance(s.now, 2) }, review));
  };

  const saveCustomTemplate: DemoApi['saveCustomTemplate'] = (source, name, fields, headers) => {
    const { state: s2, templateId } = saveTemplate(state, source, name, fields, headers);
    setState(s2);
    return templateId;
  };

  const startNewCustomer = () => {
    setPendingMapping(null);
    setState(createEmptyState());
  };

  const resetDemo = () => {
    setPendingMapping(null);
    setState(createSeed());
  };

  const api: DemoApi = {
    state, summary, attention, pendingMapping, pendingReview: state.pendingReview,
    uploadFile, uploadSample, completeMapping, editMapping, cancelMapping: () => setPendingMapping(null), confirmReview, discardReview,
    setMarketplaceMarkup, setProductMarkup, updateProduct, activateProducts, setCategoryMapping, configureOutputTemplate,
    preview, generate, redownload, markAcceptedByMarketplace,
    setTenant, setMarketplaceEnabled, setOnboardingStep, completeOnboarding, inviteTeamMember, applyDirectReview, saveCustomTemplate,
    startNewCustomer, resetDemo,
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
};

export function useDemo(): DemoApi {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDemo must be used inside <DemoProvider>');
  return c;
}
