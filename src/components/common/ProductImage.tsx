import React from 'react';

interface ProductImageProps {
  imageKey: string;
  className?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  imageKey,
  className = '',
  alt = 'Product image',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-24 h-24',
    xl: 'w-48 h-48',
  }[size];

  // SVG Artwork generators for accurate grocery product depictions matching reference screenshots
  const renderArt = () => {
    switch (imageKey) {
      case 'pepsi':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="pepsiCan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0a2569" />
                <stop offset="35%" stopColor="#004b93" />
                <stop offset="70%" stopColor="#0066c0" />
                <stop offset="100%" stopColor="#003380" />
              </linearGradient>
              <linearGradient id="silverRim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c5c7cb" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#9a9ca0" />
              </linearGradient>
            </defs>
            {/* Can Top Rim */}
            <ellipse cx="50" cy="14" rx="28" ry="7" fill="url(#silverRim)" />
            <ellipse cx="50" cy="13" rx="24" ry="4.5" fill="#a4a7ab" />
            {/* Can Body */}
            <rect x="22" y="14" width="56" height="110" rx="3" fill="url(#pepsiCan)" />
            {/* Bottom Rim */}
            <path d="M22,120 Q50,128 78,120 L75,127 Q50,133 25,127 Z" fill="url(#silverRim)" />
            {/* Pepsi Globe Symbol */}
            <circle cx="50" cy="65" r="18" fill="#ffffff" />
            <path d="M33,65 C33,55 42,50 50,50 C58,50 67,54 67,65 C62,65 57,60 49,60 C40,60 36,65 33,65 Z" fill="#d11a2a" />
            <path d="M33,65 C33,75 42,80 50,80 C58,80 67,76 67,65 C62,65 57,70 51,70 C43,70 38,65 33,65 Z" fill="#004b93" />
            {/* Pepsi Script */}
            <text x="50" y="96" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.5" fontFamily="Arial, sans-serif">pepsi</text>
          </svg>
        );

      case 'snickers':
        return (
          <svg viewBox="0 0 160 80" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="snkBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3d1e11" />
                <stop offset="100%" stopColor="#251008" />
              </linearGradient>
            </defs>
            {/* Wrapper crimps */}
            <path d="M8,15 L12,20 L8,25 L12,30 L8,35 L12,40 L8,45 L12,50 L8,55 L12,60 L8,65 L152,65 L148,60 L152,55 L148,50 L152,45 L148,40 L152,35 L148,30 L152,25 L148,20 L152,15 Z" fill="#4a2618" />
            {/* Chocolate Bar Body */}
            <rect x="14" y="16" width="132" height="48" rx="4" fill="url(#snkBg)" stroke="#5d3220" strokeWidth="1" />
            {/* White Label Background */}
            <rect x="28" y="24" width="104" height="32" rx="3" fill="#ffffff" />
            <rect x="30" y="26" width="100" height="28" rx="2" fill="#ffffff" stroke="#c4161c" strokeWidth="1.5" />
            {/* Snickers Text */}
            <text x="80" y="46" fill="#003580" fontSize="17" fontWeight="900" fontStyle="italic" textAnchor="middle" letterSpacing="0.5" fontFamily="Impact, Arial Black, sans-serif">
              SNICKERS
            </text>
          </svg>
        );

      case 'lays':
        return (
          <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="laysBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffdc00" />
                <stop offset="50%" stopColor="#ffc700" />
                <stop offset="100%" stopColor="#e5a000" />
              </linearGradient>
            </defs>
            {/* Bag shape */}
            <path d="M22,18 L78,18 L84,115 L16,115 Z" rx="6" fill="url(#laysBg)" />
            {/* Top & Bottom crimps */}
            <path d="M20,18 L80,18 L78,22 L22,22 Z" fill="#d99b00" />
            <path d="M16,113 L84,113 L82,118 L18,118 Z" fill="#d99b00" />
            {/* Lay's Yellow Sun & Red Banner */}
            <circle cx="50" cy="58" r="18" fill="#ffdd00" stroke="#f0a000" strokeWidth="1" />
            <path d="M24,56 C38,50 62,50 76,56 L73,68 C60,63 40,63 27,68 Z" fill="#d81920" />
            <text x="50" y="64" fill="#ffffff" fontSize="12" fontWeight="bold" fontStyle="italic" textAnchor="middle" fontFamily="sans-serif">
              Lay's
            </text>
            <text x="50" y="85" fill="#333333" fontSize="6" fontWeight="bold" textAnchor="middle">
              Classic
            </text>
          </svg>
        );

      case 'baladna':
        return (
          <svg viewBox="0 0 90 140" className="w-full h-full drop-shadow-sm">
            {/* Cap */}
            <rect x="36" y="8" width="18" height="12" rx="2" fill="#0072ce" />
            {/* Bottle Shoulder */}
            <path d="M36,20 L22,42 L22,126 L68,126 L68,42 L54,20 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Blue Label */}
            <rect x="22" y="55" width="46" height="50" fill="#005a9c" rx="2" />
            <circle cx="45" cy="74" r="10" fill="#ffffff" />
            <text x="45" y="78" fill="#005a9c" fontSize="6" fontWeight="bold" textAnchor="middle">🐮</text>
            <text x="45" y="93" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">Baladna</text>
            <text x="45" y="101" fill="#90cdf4" fontSize="5" textAnchor="middle">Fresh Milk</text>
          </svg>
        );

      case 'almarai':
        return (
          <svg viewBox="0 0 90 140" className="w-full h-full drop-shadow-sm">
            <rect x="37" y="12" width="16" height="10" rx="2" fill="#0d7a3e" />
            <path d="M37,22 L24,40 L24,124 L66,124 L66,40 L53,22 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="24" y="52" width="42" height="48" fill="#138d4a" />
            <circle cx="45" cy="70" r="11" fill="#ffffff" />
            <path d="M40,68 Q45,62 50,68 Q45,74 40,68 Z" fill="#138d4a" />
            <text x="45" y="88" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">Almarai</text>
            <text x="45" y="96" fill="#bbf7d0" fontSize="5" textAnchor="middle">Laban</text>
          </svg>
        );

      case 'alain':
        return (
          <svg viewBox="0 0 80 140" className="w-full h-full drop-shadow-sm">
            <rect x="34" y="10" width="12" height="10" rx="1" fill="#0088cc" />
            <path d="M34,20 L24,45 L24,126 L56,126 L56,45 L46,20 Z" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1" />
            <rect x="24" y="58" width="32" height="36" fill="#0284c7" />
            <text x="40" y="76" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">Al Ain</text>
            <text x="40" y="86" fill="#e0f2fe" fontSize="5" textAnchor="middle">1.5L</text>
          </svg>
        );

      case 'coke':
        return (
          <svg viewBox="0 0 90 140" className="w-full h-full drop-shadow-sm">
            <rect x="38" y="10" width="14" height="12" rx="2" fill="#dc2626" />
            <path d="M38,22 C34,35 22,50 22,75 C22,95 24,126 24,126 L66,126 C66,126 68,95 68,75 C68,50 56,35 52,22 Z" fill="#b91c1c" />
            <rect x="22" y="60" width="46" height="38" fill="#e11d48" />
            <text x="45" y="83" fill="#ffffff" fontSize="9" fontWeight="bold" fontStyle="italic" textAnchor="middle" fontFamily="sans-serif">
              Coca-Cola
            </text>
          </svg>
        );

      case 'nescafe':
        return (
          <svg viewBox="0 0 90 130" className="w-full h-full drop-shadow-sm">
            {/* Red Lid */}
            <rect x="26" y="14" width="38" height="16" rx="3" fill="#dc2626" />
            {/* Glass Jar Body */}
            <path d="M26,30 L22,45 L22,115 L68,115 L68,45 L64,30 Z" fill="#451a03" stroke="#e2e8f0" strokeWidth="1" />
            {/* Label */}
            <rect x="23" y="50" width="44" height="42" fill="#dc2626" rx="2" />
            <text x="45" y="72" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">NESCAFE</text>
            <text x="45" y="82" fill="#fef08a" fontSize="5" textAnchor="middle">Classic</text>
          </svg>
        );

      case 'maggi':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <rect x="15" y="15" width="70" height="70" rx="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            <path d="M15,15 L85,15 L85,45 L15,45 Z" rx="6" fill="#dc2626" />
            <text x="50" y="36" fill="#facc15" fontSize="13" fontWeight="bold" fontStyle="italic" textAnchor="middle">
              Maggi
            </text>
            <text x="50" y="68" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">Chicken</text>
            <text x="50" y="78" fill="#475569" fontSize="6" textAnchor="middle">Bouillon</text>
          </svg>
        );

      case 'pringles':
        return (
          <svg viewBox="0 0 80 140" className="w-full h-full drop-shadow-sm">
            {/* Clear plastic cap */}
            <ellipse cx="40" cy="16" rx="22" ry="7" fill="#f1f5f9" stroke="#cbd5e1" />
            {/* Can tube */}
            <rect x="18" y="16" width="44" height="108" rx="2" fill="#dc2626" />
            {/* Pringles face logo */}
            <circle cx="40" cy="46" r="13" fill="#ffffff" />
            <path d="M32,46 Q40,54 48,46 Q40,50 32,46 Z" fill="#1e293b" />
            <circle cx="36" cy="42" r="1.5" fill="#1e293b" />
            <circle cx="44" cy="42" r="1.5" fill="#1e293b" />
            <text x="40" y="72" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">PRINGLES</text>
            <text x="40" y="82" fill="#fef08a" fontSize="6" textAnchor="middle">Original</text>
          </svg>
        );

      case 'kitkat':
        return (
          <svg viewBox="0 0 140 80" className="w-full h-full drop-shadow-sm">
            <rect x="10" y="15" width="120" height="50" rx="5" fill="#dc2626" />
            <ellipse cx="70" cy="40" rx="36" ry="17" fill="#ffffff" />
            <text x="70" y="45" fill="#dc2626" fontSize="14" fontWeight="bold" fontStyle="italic" textAnchor="middle">
              KitKat
            </text>
          </svg>
        );

      case 'oreo':
        return (
          <svg viewBox="0 0 140 80" className="w-full h-full drop-shadow-sm">
            <rect x="10" y="18" width="120" height="44" rx="6" fill="#0284c7" />
            <circle cx="40" cy="40" r="16" fill="#1e293b" stroke="#0ea5e9" strokeWidth="2" />
            <text x="82" y="46" fill="#ffffff" fontSize="14" fontWeight="900" fontStyle="italic" textAnchor="middle">
              OREO
            </text>
          </svg>
        );

      case 'lurpak':
        return (
          <svg viewBox="0 0 120 90" className="w-full h-full drop-shadow-sm">
            <path d="M20,25 L100,25 L94,75 L26,75 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            <rect x="30" y="32" width="60" height="34" fill="#1e3a8a" rx="2" />
            <text x="60" y="52" fill="#ffffff" fontSize="10" fontWeight="bold" letterSpacing="1" textAnchor="middle">
              LURPAK
            </text>
            <text x="60" y="61" fill="#93c5fd" fontSize="5" textAnchor="middle">DANISH BUTTER</text>
          </svg>
        );

      case 'twix':
        return (
          <svg viewBox="0 0 140 70" className="w-full h-full drop-shadow-sm">
            <rect x="10" y="16" width="120" height="38" rx="4" fill="#d97706" />
            <text x="70" y="42" fill="#dc2626" fontSize="16" fontWeight="bold" fontStyle="italic" textAnchor="middle">
              Twix
            </text>
          </svg>
        );

      case 'haribo':
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
            <rect x="16" y="14" width="68" height="92" rx="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            <rect x="20" y="22" width="60" height="24" fill="#dc2626" rx="3" />
            <text x="50" y="38" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">HARIBO</text>
            <circle cx="50" cy="70" r="14" fill="#ea580c" />
            <text x="50" y="75" fill="#ffffff" fontSize="10" textAnchor="middle">🐻</text>
          </svg>
        );

      case 'bounty':
        return (
          <svg viewBox="0 0 140 70" className="w-full h-full drop-shadow-sm">
            <rect x="10" y="16" width="120" height="38" rx="4" fill="#0284c7" />
            <text x="70" y="42" fill="#ffffff" fontSize="14" fontWeight="bold" fontStyle="italic" letterSpacing="1" textAnchor="middle">
              BOUNTY
            </text>
          </svg>
        );

      default:
        return (
          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400">
            📦
          </div>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-white rounded border border-gray-100 p-0.5 overflow-hidden shrink-0 ${sizeClasses} ${className}`}
      title={alt}
    >
      {renderArt()}
    </div>
  );
};
