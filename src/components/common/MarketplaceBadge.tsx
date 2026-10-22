import React from 'react';
import { MarketplaceId } from '../../types';

interface MarketplaceBadgeProps {
  marketplace: MarketplaceId;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const NAMES: Record<MarketplaceId, string> = {
  talabat: 'Talabat',
  snoonu: 'Snoonu',
  rafeeq: 'Rafeeq',
  keeta: 'Keeta',
};

export const MarketplaceBadge: React.FC<MarketplaceBadgeProps> = ({
  marketplace,
  showName = true,
  className = '',
}) => {
  if (!NAMES[marketplace]) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showName && (
        <span className="text-sm font-medium text-gray-900 leading-none">
          {NAMES[marketplace]}
        </span>
      )}
    </div>
  );
};

export const MarketplacePill: React.FC<{
  marketplace: MarketplaceId;
  className?: string;
}> = ({ marketplace, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200 ${className}`}
    >
      {NAMES[marketplace]}
    </span>
  );
};
