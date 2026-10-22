import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft, Pencil, Plus, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MarketplaceBadge } from '../common/MarketplaceBadge';
import { useDemo, ERP_FIELDS, MARKETPLACE_FIELDS } from '../../demo';
import type { MarketplaceId, SourceId } from '../../demo';

const MP_NAMES: Record<MarketplaceId, string> = {
  talabat: 'Talabat',
  snoonu: 'Snoonu',
  rafeeq: 'Rafeeq',
  keeta: 'Keeta',
};

const SOURCE_NAMES: Record<SourceId, string> = { erp: 'ERP', ...MP_NAMES };

export const TemplatesView: React.FC = () => {
  const { showToast, navigate } = useApp();
  const { state, editMapping } = useDemo();
  const [loading, setLoading] = useState<SourceId | null>(null);

  const enabledMps = useMemo(() => state.marketplaces.filter((m) => m.enabled), [state.marketplaces]);
  const enabledMpIds = useMemo(() => new Set(enabledMps.map((m) => m.id)), [enabledMps]);

  const sources: SourceId[] = useMemo(() => ['erp', ...enabledMps.map((m) => m.id)], [enabledMps]);

  const handleEdit = async (src: SourceId) => {
    setLoading(src);
    const r = await editMapping(src);
    setLoading(null);
    if (r.next === 'mapping') navigate('column-mapping');
    else if (r.next === 'error') showToast(r.message, 'warning');
  };

  const outputFormats = useMemo(
    () => state.outputTemplates.filter((t) => enabledMpIds.has(t.marketplaceId)),
    [state.outputTemplates, enabledMpIds]
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          File mapping
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          How Qorloop reads the files you upload, and how it writes the files you send back to each marketplace
        </p>
      </div>

      {/* Section 1: Incoming files */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Incoming files: how Qorloop reads each file</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Every source exports its file with different column names. This tells Qorloop which column is the barcode, the price, the stock, and so on.
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {sources.map((src) => {
            const tpl = [...state.inputTemplates].reverse().find((t) => t.source === src);
            const labels = src === 'erp' ? ERP_FIELDS : MARKETPLACE_FIELDS;
            const mapped = tpl ? labels.filter((f) => tpl.fields[f.key]) : [];
            return (
              <div key={src} className="px-6 py-4 flex items-start gap-6 hover:bg-gray-50/60">
                <div className="w-40 shrink-0 pt-0.5">
                  {src === 'erp' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-900 text-white">
                      <Database className="w-3.5 h-3.5" /> ERP export
                    </span>
                  ) : (
                    <MarketplaceBadge marketplace={src} />
                  )}
                  <div className="mt-2">
                    {tpl ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" /> Mapped · v{tpl.version}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <AlertCircle className="w-3 h-3" /> Not mapped yet
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {tpl ? (
                    <>
                      <p className="text-xs text-gray-500 mb-2">{tpl.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {mapped.map((f) => (
                          <span key={f.key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[11px]">
                            <span className="font-semibold text-gray-800">{f.label}</span>
                            <ArrowLeft className="w-3 h-3 text-gray-400" />
                            <span className="font-mono text-gray-600">{tpl.fields[f.key]}</span>
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Qorloop hasn't seen a {SOURCE_NAMES[src]} file yet. Set up the mapping now, or upload the file and Qorloop will ask you then.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleEdit(src)}
                  disabled={loading === src}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 ${
                    tpl
                      ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      : 'bg-[#027864] hover:bg-[#02604F] text-white'
                  }`}
                >
                  {tpl ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {loading === src ? 'Opening…' : tpl ? 'View / edit mapping' : 'Set up mapping'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Outgoing files */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Outgoing files: marketplace upload formats
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              The exact columns each marketplace's seller portal expects when Qorloop generates a corrected file (built in)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F7F6] text-gray-500 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5">Upload Format</th>
                <th className="px-4 py-3.5">Marketplace</th>
                <th className="px-4 py-3.5 text-center">Columns</th>
                <th className="px-6 py-3.5">Output Columns</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
              {outputFormats.map((t) => (
                <tr key={t.marketplaceId} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-gray-900">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <MarketplaceBadge marketplace={t.marketplaceId} />
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-gray-900 font-semibold">
                    {t.columns.length}
                  </td>
                  <td className="px-6 py-4">
                    {t.columns.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {t.columns.slice(0, 4).map((col) => (
                          <span
                            key={col}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-mono"
                          >
                            {col}
                          </span>
                        ))}
                        {t.columns.length > 4 && (
                          <span className="px-1.5 py-0.5 text-gray-400 text-[10px]">
                            +{t.columns.length - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs italic">
                        Qorloop can compare {MP_NAMES[t.marketplaceId]} prices but can't create {MP_NAMES[t.marketplaceId]} update files yet.
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    {t.configured ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Built in
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        <AlertCircle className="w-3 h-3" />
                        Comparison only
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
