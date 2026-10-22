import React from 'react';
import { Network, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { useDemo, MARKETPLACE_IDS } from '../../demo';
import type { MarketplaceId } from '../../demo';

const MP_NAMES: Record<MarketplaceId, string> = {
  talabat: 'Talabat',
  snoonu: 'Snoonu',
  rafeeq: 'Rafeeq',
  keeta: 'Keeta',
};

export const CategoryMappingView: React.FC = () => {
  const { state, setCategoryMapping } = useDemo();

  const getMappingValue = (categoryId: string, mp: MarketplaceId): string => {
    const m = state.categoryMappings.find(
      (cm) => cm.categoryId === categoryId && cm.marketplaceId === mp
    );
    return m?.marketplaceCategory || '';
  };

  // Compute total unmapped counts
  const unmappedTotal = state.categories.reduce((acc, cat) => {
    let missingForCat = 0;
    for (const mp of MARKETPLACE_IDS) {
      if (!getMappingValue(cat.id, mp)) missingForCat++;
    }
    return acc + missingForCat;
  }, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Category Mapping
          </h1>
          {unmappedTotal > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              {unmappedTotal} unmapped
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Map internal Qorloop supermarket categories to each marketplace's specific taxonomy for new product listings
        </p>
      </div>

      {/* Info notice */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 leading-relaxed">
          <strong>Why this is needed:</strong> When new products are activated and exported to partner portals (e.g. Talabat, Snoonu, Rafeeq, Keeta), each item must include the partner's exact category string. Empty cells below are highlighted and will prevent generating new product files for that marketplace.
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Qorloop Categories &times; Marketplaces</h2>
          <span className="text-xs text-gray-500">{state.categories.length} Qorloop categories</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F7F6] text-gray-500 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5 w-64">Qorloop Category</th>
                {MARKETPLACE_IDS.map((mp) => (
                  <th key={mp} className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span>{MP_NAMES[mp]} Category</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {state.categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* Category Name */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{c.nameEn}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5" dir="rtl">
                      {c.nameAr}
                    </div>
                  </td>

                  {/* Marketplace Columns */}
                  {MARKETPLACE_IDS.map((mp) => {
                    const val = getMappingValue(c.id, mp);
                    const isMissing = !val;

                    return (
                      <td key={mp} className="px-4 py-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Needed for new-product files"
                            value={val}
                            onChange={(e) =>
                              setCategoryMapping(
                                c.id,
                                mp,
                                e.target.value.trim() || null
                              )
                            }
                            className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
                              isMissing
                                ? 'border-amber-300 bg-amber-50/50 text-amber-900 placeholder:text-amber-500/80 font-medium'
                                : 'border-gray-200 bg-white text-gray-900 focus:ring-1 focus:ring-[#027864]'
                            }`}
                          />
                          {isMissing && (
                            <span className="text-[9px] text-amber-600 font-semibold block mt-0.5">
                              Unmapped
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
