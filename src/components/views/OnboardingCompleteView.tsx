import React, { useState, useMemo } from 'react';
import {
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Upload,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import logo from '../../assets/qorloop-logo.png';
import {
  useDemo,
  latestUpload,
  detectTemplate,
  suggestMapping,
  parseUpload,
  buildReview,
  readSpreadsheet,
  readSample,
  SAMPLE_FILES,
  ERP_FIELDS,
  MARKETPLACE_FIELDS,
} from '../../demo';
import type { MarketplaceId, SourceId, PendingReview, SheetRow } from '../../demo';
import { MarketplaceBadge } from '../common/MarketplaceBadge';
import { ColumnMappingPanel } from '../common/ColumnMappingPanel';

const MP_NAMES: Record<MarketplaceId, string> = {
  talabat: 'Talabat',
  snoonu: 'Snoonu',
  rafeeq: 'Rafeeq',
  keeta: 'Keeta',
};

const SOURCE_NAMES: Record<SourceId, string> = {
  erp: 'ERP',
  talabat: 'Talabat',
  snoonu: 'Snoonu',
  rafeeq: 'Rafeeq',
  keeta: 'Keeta',
};

export const OnboardingCompleteView: React.FC = () => {
  const { navigate, showToast } = useApp();
  const {
    state,
    summary,
    setTenant,
    setMarketplaceEnabled,
    setMarketplaceMarkup,
    setOnboardingStep,
    completeOnboarding,
    applyDirectReview,
    saveCustomTemplate,
    inviteTeamMember,
  } = useDemo();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Catalogue Manager' | 'Admin' | 'Analyst'>('Catalogue Manager');

  const currentStep = state.onboarding?.step ?? 1;

  // Step 1 local state
  const [storeName, setStoreName] = useState(state.tenant.name || 'Doha Fresh Markets');
  const [branchName, setBranchName] = useState(state.tenant.branch || 'Al Waab Branch');

  // Step 2 local state
  const [marketplaces, setMarketplaces] = useState(() =>
    state.marketplaces.map((m) => ({
      id: m.id,
      name: m.name,
      enabled: m.enabled,
      markupPct: String(m.defaultMarkupPct),
    }))
  );

  // Step 3 ERP local state
  const [erpLoading, setErpLoading] = useState(false);
  const [erpReview, setErpReview] = useState<PendingReview | null>(null);
  const [erpErrorDetailsOpen, setErpErrorDetailsOpen] = useState(false);
  const [erpPendingMapping, setErpPendingMapping] = useState<{
    headers: string[];
    rows: SheetRow[];
    fileName: string;
    sizeKb: number;
    suggested: Record<string, string>;
  } | null>(null);

  // Step 4 Marketplace files local state
  const [mpLoading, setMpLoading] = useState<MarketplaceId | null>(null);
  const [mpFileWarning, setMpFileWarning] = useState<{ mpId: MarketplaceId; message: string } | null>(null);
  const [mpPendingMapping, setMpPendingMapping] = useState<{
    mpId: MarketplaceId;
    headers: string[];
    rows: SheetRow[];
    fileName: string;
    sizeKb: number;
    suggested: Record<string, string>;
  } | null>(null);
  const [skippedMarketplaces, setSkippedMarketplaces] = useState<Set<MarketplaceId>>(new Set());

  const enabledMps = useMemo(
    () => state.marketplaces.filter((m) => m.enabled),
    [state.marketplaces]
  );

  // ---------- STEP 1 ACTIONS ----------
  const handleSaveStep1 = () => {
    if (!storeName.trim()) return;
    setTenant({
      name: storeName.trim(),
      branch: branchName.trim(),
      erpName: state.tenant.erpName,
    });
    setOnboardingStep(2);
  };

  // ---------- STEP 2 ACTIONS ----------
  const handleToggleMarketplace = (id: MarketplaceId) => {
    setMarketplaces((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleMarkupChange = (id: MarketplaceId, val: string) => {
    setMarketplaces((prev) =>
      prev.map((m) => (m.id === id ? { ...m, markupPct: val } : m))
    );
  };

  const step2Valid = useMemo(() => {
    const enabledList = marketplaces.filter((m) => m.enabled);
    if (enabledList.length === 0) return false;
    for (const m of enabledList) {
      if (m.markupPct.trim() === '') return false;
      const n = Number(m.markupPct);
      if (isNaN(n) || n < 0 || n > 100) return false;
    }
    return true;
  }, [marketplaces]);

  const handleSaveStep2 = () => {
    if (!step2Valid) return;
    for (const m of marketplaces) {
      setMarketplaceEnabled(m.id, m.enabled);
      if (m.enabled) {
        setMarketplaceMarkup(m.id, Number(m.markupPct));
      }
    }
    setOnboardingStep(3);
  };

  // ---------- STEP 3 ERP ACTIONS ----------
  const handleProcessErpFile = (fileName: string, sizeKb: number, headers: string[], rows: SheetRow[]) => {
    const tpl = detectTemplate(state, 'erp', headers);
    if (!tpl) {
      setErpPendingMapping({
        headers,
        rows,
        fileName,
        sizeKb,
        suggested: suggestMapping('erp', headers),
      });
      return;
    }
    const parsed = parseUpload(state, 'erp', fileName, sizeKb, 'full', headers, rows);
    const review = buildReview(state, parsed);
    setErpReview(review);
    setErpPendingMapping(null);
  };

  const handleErpUploadSample = async () => {
    setErpLoading(true);
    try {
      const sample = SAMPLE_FILES.find((f) => f.source === 'erp');
      if (!sample) return;
      const { data, sizeKb } = await readSample(sample.path);
      handleProcessErpFile(sample.label, sizeKb, data.headers, data.rows);
    } catch (err) {
      showToast('Failed to load sample ERP file', 'error');
    } finally {
      setErpLoading(false);
    }
  };

  const handleErpUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErpLoading(true);
    try {
      const data = await readSpreadsheet(file);
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      handleProcessErpFile(file.name, sizeKb, data.headers, data.rows);
    } catch (err) {
      showToast('Failed to read uploaded file', 'error');
    } finally {
      setErpLoading(false);
    }
  };

  const handleSaveErpMapping = (fields: Record<string, string>, templateName: string) => {
    if (!erpPendingMapping) return;
    const templateId = saveCustomTemplate('erp', templateName, fields, erpPendingMapping.headers);
    const parsed = parseUpload(
      state,
      'erp',
      erpPendingMapping.fileName,
      erpPendingMapping.sizeKb,
      'full',
      erpPendingMapping.headers,
      erpPendingMapping.rows,
      { templateId, fields }
    );
    const review = buildReview(state, parsed);
    setErpReview(review);
    setErpPendingMapping(null);
    showToast('ERP file mapping saved', 'success');
  };

  const handleConfirmErpReview = () => {
    if (!erpReview) return;
    applyDirectReview(erpReview);
    showToast('ERP catalogue loaded successfully', 'success');
    setOnboardingStep(4);
  };

  // Check if ERP is already uploaded in state
  const existingErpUpload = latestUpload(state, 'erp');

  // ---------- STEP 4 MARKETPLACE FILES ACTIONS ----------
  const handleProcessMpFile = (mpId: MarketplaceId, fileName: string, sizeKb: number, headers: string[], rows: SheetRow[]) => {
    setMpFileWarning(null);

    // Cross-source layout detection warning
    const otherSources: SourceId[] = (['erp', 'talabat', 'snoonu', 'rafeeq', 'keeta'] as SourceId[]).filter(
      (s) => s !== mpId
    );
    for (const other of otherSources) {
      const otherMatch = detectTemplate(state, other, headers);
      if (otherMatch) {
        setMpFileWarning({
          mpId,
          message: `This looks like a ${SOURCE_NAMES[other]} file, not a ${SOURCE_NAMES[mpId]} file.`,
        });
        return;
      }
    }

    const tpl = detectTemplate(state, mpId, headers);
    if (!tpl) {
      setMpPendingMapping({
        mpId,
        headers,
        rows,
        fileName,
        sizeKb,
        suggested: suggestMapping(mpId, headers),
      });
      return;
    }

    // Layout recognised! Parse and apply review directly
    const parsed = parseUpload(state, mpId, fileName, sizeKb, 'full', headers, rows);
    const review = buildReview(state, parsed);
    applyDirectReview(review);
    setSkippedMarketplaces((prev) => {
      const next = new Set(prev);
      next.delete(mpId);
      return next;
    });
    showToast(`${MP_NAMES[mpId]} catalogue loaded (${review.summary.matched} products matched)`, 'success');
  };

  const handleMpUploadSample = async (mpId: MarketplaceId) => {
    setMpLoading(mpId);
    try {
      const sample = SAMPLE_FILES.find((f) => f.source === mpId);
      if (!sample) return;
      const { data, sizeKb } = await readSample(sample.path);
      handleProcessMpFile(mpId, sample.label, sizeKb, data.headers, data.rows);
    } catch (err) {
      showToast(`Failed to load ${MP_NAMES[mpId]} sample file`, 'error');
    } finally {
      setMpLoading(null);
    }
  };

  const handleMpUploadFile = async (mpId: MarketplaceId, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMpLoading(mpId);
    try {
      const data = await readSpreadsheet(file);
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      handleProcessMpFile(mpId, file.name, sizeKb, data.headers, data.rows);
    } catch (err) {
      showToast(`Failed to read file for ${MP_NAMES[mpId]}`, 'error');
    } finally {
      setMpLoading(null);
    }
  };

  const handleSaveMpMapping = (fields: Record<string, string>, templateName: string) => {
    if (!mpPendingMapping) return;
    const { mpId, fileName, sizeKb, headers, rows } = mpPendingMapping;
    const templateId = saveCustomTemplate(mpId, templateName, fields, headers);
    const parsed = parseUpload(state, mpId, fileName, sizeKb, 'full', headers, rows, { templateId, fields });
    const review = buildReview(state, parsed);
    applyDirectReview(review);
    setMpPendingMapping(null);
    setSkippedMarketplaces((prev) => {
      const next = new Set(prev);
      next.delete(mpId);
      return next;
    });
    showToast(`${MP_NAMES[mpId]} file mapping saved and products matched`, 'success');
  };

  const handleSkipMarketplace = (mpId: MarketplaceId) => {
    setSkippedMarketplaces((prev) => new Set(prev).add(mpId));
  };

  // ---------- STEP 5 RESULTS ACTIONS ----------
  const handleSeeTheProblems = () => {
    completeOnboarding();
    navigate('dashboard');
  };

  const stepsList = [
    { number: 1, label: 'Your store' },
    { number: 2, label: 'Marketplaces' },
    { number: 3, label: 'ERP file' },
    { number: 4, label: 'Marketplace files' },
    { number: 5, label: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-[#F2F7F6] pb-16">
      {/* Top Navbar */}
      <div className="q-hero px-8 py-3 flex items-center justify-between">
        <div
          onClick={() => {
            if (state.onboarding?.completedAt) navigate('dashboard');
          }}
          className="select-none cursor-pointer"
        >
          <img src={logo} alt="Qorloop" className="h-11 w-auto" />
        </div>
        <button
          onClick={() => {
            completeOnboarding();
            navigate('dashboard');
          }}
          className="h-9 px-3.5 rounded-[10px] text-xs font-semibold text-white bg-white/10 border border-[#8CFFE7]/25 hover:bg-white/15 transition-colors"
        >
          Save and exit
        </button>
      </div>

      <div className="max-w-3xl mx-auto pt-8 px-4 space-y-6">
        {/* Horizontal Onboarding Stepper */}
        <div className="relative flex items-center justify-between px-6 py-2">
          {/* Continuous connector line behind circles */}
          <div className="absolute top-4 left-10 right-10 h-[2px] bg-gray-200 z-0" />

          {stepsList.map((step) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            // A step the user skipped shows a warning instead of a tick.
            const isIncomplete =
              isCompleted &&
              ((step.number === 3 && !latestUpload(state, 'erp')) ||
                (step.number === 4 && enabledMps.some((m) => !summary[m.id]?.hasData)));

            return (
              <div key={step.number} className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${isIncomplete
                      ? 'bg-amber-100 text-amber-600 border-2 border-amber-300'
                      : isCompleted
                        ? 'bg-[#027864] text-white'
                        : isCurrent
                          ? 'bg-[#027864] text-white ring-4 ring-emerald-100'
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                    }`}
                >
                  {isIncomplete ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`mt-2 text-[11px] whitespace-nowrap leading-tight ${isCurrent
                      ? 'font-bold text-[#027864]'
                      : isCompleted
                        ? 'font-semibold text-gray-800'
                        : 'text-gray-500 font-medium'
                    }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ================= STEP 1: YOUR STORE ================= */}
        {currentStep === 1 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your store</h2>
              <p className="text-xs text-gray-500 mt-1">
                Tell us about your business.
              </p>
            </div>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Store name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Doha Fresh Markets"
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#027864]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Branch / Location
                </label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Al Waab Branch"
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#027864]"
                />
              </div>

            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveStep1}
                disabled={!storeName.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#027864] hover:bg-[#02604F] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: MARKETPLACES ================= */}
        {currentStep === 2 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select your marketplaces</h2>
              <p className="text-xs text-gray-500 mt-1">
                Choose the delivery platforms you sell on and set your default markup percentage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketplaces.map((m) => {
                const mpId = m.id as MarketplaceId;
                const isKeeta = mpId === 'keeta';

                return (
                  <div
                    key={m.id}
                    className={`border rounded-xl p-4 transition-all ${m.enabled
                        ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
                        : 'border-gray-200 bg-gray-50/50 opacity-80'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <MarketplaceBadge marketplace={mpId} />
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700 select-none">
                        <input
                          type="checkbox"
                          checked={m.enabled}
                          onChange={() => handleToggleMarketplace(mpId)}
                          className="w-4 h-4 rounded border-gray-300 text-[#027864] focus:ring-[#027864]"
                        />
                        <span>I sell on this</span>
                      </label>
                    </div>

                    {m.enabled ? (
                      <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-gray-700">
                            Default Markup
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={m.markupPct}
                              onChange={(e) => handleMarkupChange(mpId, e.target.value)}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded-lg text-right font-mono focus:outline-none focus:ring-1 focus:ring-[#027864]"
                            />
                            <span className="text-xs font-semibold text-gray-600">%</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Your {m.name} price = ERP price + {m.markupPct || '0'}%
                        </p>
                        {isKeeta && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-2 py-1 mt-1">
                            Comparison only, update files not available yet
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 italic">
                        Not active
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!step2Valid && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Please select at least 1 marketplace and ensure all enabled markups are numbers between 0 and 100.
                </span>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setOnboardingStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSaveStep2}
                disabled={!step2Valid}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#027864] hover:bg-[#02604F] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs"
              >
                <span>Continue to ERP file</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: ERP FILE ================= */}
        {currentStep === 3 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upload your ERP catalogue</h2>
              <p className="text-xs text-gray-500 mt-1">
                Upload your item master export. On first setup, Qorloop automatically activates your existing products.
              </p>
            </div>

            {/* Inline Column Mapping if columns unrecognized */}
            {erpPendingMapping ? (
              <div className="space-y-4 border border-amber-200 bg-amber-50/20 p-5 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Map ERP columns</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Qorloop didn't recognise this file layout automatically. Map the columns below to continue:
                  </p>
                </div>
                <ColumnMappingPanel
                  source="erp"
                  sourceName="ERP"
                  headers={erpPendingMapping.headers}
                  rows={erpPendingMapping.rows}
                  initialMapping={erpPendingMapping.suggested}
                  onSave={handleSaveErpMapping}
                  onCancel={() => setErpPendingMapping(null)}
                  saveButtonLabel="Save and parse file"
                  compact
                />
              </div>
            ) : erpReview ? (
              /* Inline Summary of recognized ERP file */
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900">
                          {erpReview.upload.fileName}
                        </h4>
                        <p className="text-xs text-emerald-700">Columns recognized successfully</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErpReview(null)}
                      className="text-xs text-emerald-800 hover:underline font-medium"
                    >
                      Change file
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-white/80 rounded-lg p-3 border border-emerald-200/60 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{erpReview.summary.rowsRead}</div>
                      <div className="text-[11px] text-gray-500">Rows read</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-700">
                        {erpReview.newProducts.length + erpReview.summary.matched}
                      </div>
                      <div className="text-[11px] text-gray-500">Products found</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${erpReview.errors.length ? 'text-amber-600' : 'text-gray-900'}`}>
                        {erpReview.errors.length}
                      </div>
                      <div className="text-[11px] text-gray-500">Rows with errors</div>
                    </div>
                  </div>

                  {/* Expandable errors list */}
                  {erpReview.errors.length > 0 && (
                    <div className="border-t border-emerald-200/60 pt-3">
                      <button
                        type="button"
                        onClick={() => setErpErrorDetailsOpen(!erpErrorDetailsOpen)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:underline"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>
                          {erpErrorDetailsOpen ? 'Hide' : 'View'} error rows ({erpReview.errors.length})
                        </span>
                        {erpErrorDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {erpErrorDetailsOpen && (
                        <div className="mt-2.5 max-h-48 overflow-y-auto bg-white rounded-lg border border-gray-200 p-2 text-[11px]">
                          <table className="w-full text-left">
                            <thead className="text-gray-500 font-semibold border-b border-gray-100">
                              <tr>
                                <th className="py-1 px-2">Row</th>
                                <th className="py-1 px-2">Column</th>
                                <th className="py-1 px-2">Value</th>
                                <th className="py-1 px-2">Reason</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {erpReview.errors.map((e, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="py-1 px-2 font-mono">{e.row}</td>
                                  <td className="py-1 px-2 font-medium text-gray-700">{e.column}</td>
                                  <td className="py-1 px-2 font-mono text-gray-500 truncate max-w-[100px]">{e.value || '—'}</td>
                                  <td className="py-1 px-2 text-red-600">{e.reason}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleConfirmErpReview}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#027864] hover:bg-[#02604F] rounded-xl transition-colors shadow-xs"
                  >
                    <span>Looks right, continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : existingErpUpload ? (
              /* Already has an applied ERP upload */
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">ERP Catalogue Loaded</h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {existingErpUpload.fileName} · {existingErpUpload.summary.rowsRead} products active
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger re-upload
                      handleErpUploadSample();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Re-upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(4)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#027864] hover:bg-[#02604F] rounded-lg shadow-xs"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Area */
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-4 hover:border-gray-400 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-500">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-[#027864] hover:underline">
                    <span>Click to browse</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleErpUploadFile}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-500"> or drag and drop your ERP Excel file here</span>
                  <p className="text-[11px] text-gray-400 mt-1">Accepts XLSX, XLS, CSV up to 25 MB</p>
                </div>

                <div className="pt-2">
                  <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">or</span>
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={erpLoading}
                      onClick={handleErpUploadSample}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#027864]" />
                      <span>{erpLoading ? 'Loading sample…' : 'Use sample file (Item_Master_06Oct2026.xlsx)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setOnboardingStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              {/* Skip: marketplace files can't be matched without the ERP catalogue,
                  so skipping here jumps to the summary, which shows the ERP file as not uploaded. */}
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-[11px] text-gray-400">
                  Nothing can be compared until the ERP file is uploaded.
                </span>
                <button
                  type="button"
                  onClick={() => setOnboardingStep(5)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: MARKETPLACE FILES ================= */}
        {currentStep === 4 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upload marketplace exports</h2>
              <p className="text-xs text-gray-500 mt-1">
                Upload the export from each platform's seller portal. Qorloop compares these against your ERP.
              </p>
            </div>

            {/* Warning if wrong file layout uploaded */}
            {mpFileWarning && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{mpFileWarning.message}</span>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Please ensure you upload the file from the correct marketplace portal.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMpFileWarning(null)}
                  className="text-amber-800 hover:underline font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Inline Column Mapping for marketplace files */}
            {mpPendingMapping && (
              <div className="space-y-4 border border-amber-200 bg-amber-50/20 p-5 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Map {MP_NAMES[mpPendingMapping.mpId]} columns
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Qorloop hasn't seen this file format before. Match each Qorloop field to the file column:
                  </p>
                </div>
                <ColumnMappingPanel
                  source={mpPendingMapping.mpId}
                  sourceName={MP_NAMES[mpPendingMapping.mpId]}
                  headers={mpPendingMapping.headers}
                  rows={mpPendingMapping.rows}
                  initialMapping={mpPendingMapping.suggested}
                  onSave={handleSaveMpMapping}
                  onCancel={() => setMpPendingMapping(null)}
                  saveButtonLabel="Save mapping & match products"
                  compact
                />
              </div>
            )}

            {/* Rows for each enabled marketplace */}
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {enabledMps.map((m) => {
                const mpId = m.id;
                const up = latestUpload(state, mpId);
                const isSkipped = skippedMarketplaces.has(mpId);
                const isLoading = mpLoading === mpId;

                return (
                  <div key={mpId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <MarketplaceBadge marketplace={mpId} />
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{m.name}</div>
                        {up ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{up.summary.matched} products matched</span>
                          </div>
                        ) : isSkipped ? (
                          <div className="text-[11px] text-gray-400 italic mt-0.5">
                            Skipped for now (shows as No file yet on dashboard)
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            No export uploaded yet
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Upload button with file input */}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5 text-gray-500" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          disabled={isLoading}
                          onChange={(e) => handleMpUploadFile(mpId, e)}
                          className="hidden"
                        />
                      </label>

                      {/* Sample button */}
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleMpUploadSample(mpId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#027864] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>{isLoading ? 'Loading…' : 'Use sample'}</span>
                      </button>

                      {/* Skip button */}
                      {!up && !isSkipped && (
                        <button
                          type="button"
                          onClick={() => handleSkipMarketplace(mpId)}
                          className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:underline"
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setOnboardingStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setOnboardingStep(5)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#027864] hover:bg-[#02604F] rounded-xl transition-colors shadow-xs"
              >
                <span>Finish setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: SETUP SUMMARY ================= */}
        {/* Always shown at the end, even when steps were skipped: each row reads live data,
            so a skipped step shows as a warning with a link back to finish it. */}
        {currentStep === 5 && (() => {
          const erpUp = latestUpload(state, 'erp');
          const uploadedMps = enabledMps.filter((m) => summary[m.id]?.hasData);
          const missingMps = enabledMps.filter((m) => !summary[m.id]?.hasData);
          const checkRan = !!erpUp && uploadedMps.length > 0;
          const totals = uploadedMps.reduce(
            (a, m) => ({ total: a.total + summary[m.id].total, stock: a.stock + summary[m.id].stock, price: a.price + summary[m.id].price }),
            { total: 0, stock: 0, price: 0 },
          );
          const allDone = !!erpUp && missingMps.length === 0;
          const invited = state.team.filter((t) => t.id !== state.currentUser.id && t.status === 'Invited');

          type Row = { title: string; detail: string; tone: 'done' | 'warn' | 'idle'; chip?: string; action?: { label: string; onClick: () => void } };
          const rows: Row[] = [
            {
              title: 'Business details',
              detail: [state.tenant.name, state.tenant.branch, state.tenant.country].filter(Boolean).join(', '),
              tone: 'done',
              chip: 'Done',
            },
            {
              title: 'Marketplaces',
              detail: enabledMps.map((m) => `${m.name} +${m.defaultMarkupPct}%`).join(', '),
              tone: 'done',
              chip: 'Done',
            },
            erpUp
              ? { title: 'ERP file', detail: `${state.products.length.toLocaleString()} products from ${erpUp.fileName}`, tone: 'done', chip: 'Done' }
              : {
                title: 'ERP file',
                detail: 'Skipped. Nothing can be compared until it is uploaded.',
                tone: 'warn',
                chip: 'Not uploaded',
                action: { label: 'Upload now', onClick: () => setOnboardingStep(3) },
              },
            !erpUp
              ? { title: 'Marketplace files', detail: 'Upload the ERP file first.', tone: 'idle', chip: `0 of ${enabledMps.length}` }
              : missingMps.length === 0
                ? { title: 'Marketplace files', detail: `${uploadedMps.map((m) => m.name).join(', ')} uploaded`, tone: 'done', chip: 'Done' }
                : {
                  title: 'Marketplace files',
                  detail: `${uploadedMps.length} of ${enabledMps.length} uploaded. ${missingMps.map((m) => m.name).join(', ')} skipped.`,
                  tone: 'warn',
                  chip: `${uploadedMps.length} of ${enabledMps.length}`,
                  action: { label: `Upload ${missingMps[0].name}`, onClick: () => setOnboardingStep(4) },
                },
            checkRan
              ? {
                title: 'First stock and price check',
                detail: totals.total
                  ? `${totals.total} problems found: ${totals.stock} stock, ${totals.price} price`
                  : 'Everything is in sync',
                tone: totals.total ? 'warn' : 'done',
                chip: totals.total ? `${totals.total} problems` : 'In sync',
                action: totals.total ? { label: 'See problems', onClick: handleSeeTheProblems } : undefined,
              }
              : { title: 'First stock and price check', detail: 'Runs once the ERP file and at least one marketplace file are uploaded.', tone: 'idle' },
          ];

          return (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs animate-in fade-in duration-150">
              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${allDone ? 'bg-[#16A34A] text-white' : 'bg-amber-100 text-amber-600'}`}>
                    {allDone ? <Check className="w-6 h-6 stroke-[3]" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                      {state.tenant.name} is {allDone ? 'ready' : 'almost ready'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {allDone
                        ? 'Your account is set up and your catalogue is loaded. You can now check stock and price mismatches and generate files for each marketplace.'
                        : 'Your account is set up. Finish the remaining items below now, or any time from the dashboard.'}
                    </p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
                  {rows.map((r) => (
                    <div key={r.title} className="flex items-center gap-4 py-3.5">
                      <div className="w-6 shrink-0 flex justify-center">
                        {r.tone === 'done' ? (
                          <div className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : r.tone === 'warn' ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{r.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.detail}</div>
                      </div>
                      {r.chip && (
                        <span
                          className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${r.tone === 'done' ? 'bg-emerald-50 text-emerald-800' : r.tone === 'warn' ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-500'
                            }`}
                        >
                          {r.chip}
                        </span>
                      )}
                      {r.action && (
                        <button type="button" onClick={r.action.onClick} className="shrink-0 text-xs font-semibold text-blue-600 hover:underline">
                          {r.action.label}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Invite your team (optional) */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Invite your team</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Optional. You can always invite more people later from Settings.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="name@yourcompany.qa"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#027864]"
                      />
                    </div>
                    <div className="sm:w-48">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#027864]"
                      >
                        <option value="Catalogue Manager">Catalogue Manager</option>
                        <option value="Admin">Admin</option>
                        <option value="Analyst">Analyst</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={!/^\S+@\S+\.\S+$/.test(inviteEmail.trim())}
                      onClick={() => {
                        inviteTeamMember(inviteEmail.trim(), inviteRole);
                        showToast(`Invite sent to ${inviteEmail.trim()}`, 'success');
                        setInviteEmail('');
                      }}
                      className="px-5 py-2 text-xs font-semibold text-white bg-[#027864] hover:bg-[#02604F] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send invite
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {inviteRole === 'Admin'
                      ? 'Admin can do everything, including settings and team.'
                      : inviteRole === 'Analyst'
                        ? 'Analyst can view reports and download files, but not change data.'
                        : 'Catalogue Manager can upload files, fix mismatches, list new products and set markups.'}
                  </p>
                  {invited.length > 0 && (
                    <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left font-medium px-3 py-2">Email</th>
                          <th className="text-left font-medium px-3 py-2">Role</th>
                          <th className="text-left font-medium px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invited.map((t) => (
                          <tr key={t.id}>
                            <td className="px-3 py-2 text-gray-900">{t.email}</td>
                            <td className="px-3 py-2 text-gray-700">{t.role}</td>
                            <td className="px-3 py-2 text-gray-600">
                              <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Invited</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Daily routine */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="pt-4">
                    <h3 className="text-base font-bold text-gray-900">Your daily routine</h3>
                    <p className="text-xs text-gray-500 mt-0.5">A simple 3-step routine to keep your listings in sync.</p>
                  </div>
                  {[
                    { t: "Upload today's ERP file", d: 'Bring in the latest stock and prices.' },
                    { t: 'Upload marketplace files', d: `Upload the latest files from ${enabledMps.map((m) => m.name).join(', ')}.` },
                    { t: 'Download corrected files', d: 'Review mismatches and download ready-to-upload files for each marketplace.' },
                  ].map((x, i) => (
                    <div key={x.t} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#027864] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{x.t}</div>
                        <div className="text-[11px] text-gray-500">{x.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(erpUp ? 4 : 3)}
                  className="px-5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSeeTheProblems}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#027864] hover:bg-[#02604F] rounded-lg shadow-xs"
                >
                  Go to dashboard
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
