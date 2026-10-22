import React from 'react';
import { SOURCE_LABELS, SOURCE_STYLES } from '../../lib/pricing';
import { PriceSource } from '../../types';

export const PriceSourceChip: React.FC<{ source: PriceSource; className?: string }> = ({
  source,
  className = '',
}) => (
  <span
    className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium leading-none ${SOURCE_STYLES[source]} ${className}`}
  >
    {SOURCE_LABELS[source]}
  </span>
);
