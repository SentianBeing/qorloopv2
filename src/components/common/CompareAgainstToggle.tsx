import React from 'react';
import { useApp } from '../../context/AppContext';
import { CompareReference } from '../../types';

/** "Compare against: Marketplace price | ERP price" — shared by the price reports and generated files. */
export const CompareAgainstToggle: React.FC<{ className?: string; label?: string }> = ({
  className = '',
  label = 'Compare against',
}) => {
  const { compareReference, setCompareReference } = useApp();

  const options: { id: CompareReference; label: string }[] = [
    { id: 'marketplace', label: 'Marketplace price' },
    { id: 'erp', label: 'ERP price' },
  ];

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <span className="text-gray-500">{label}</span>
      <div className="inline-flex items-center p-0.5 bg-gray-100 border border-gray-200 rounded-lg">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => setCompareReference(o.id)}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${compareReference === o.id
                ? 'bg-white text-[#027864] shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-gray-700 border border-transparent'
              }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};
