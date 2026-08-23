import React from 'react';
import type { FloorId } from '../types/stock';

interface IconProps {
  className?: string;
  size?: number;
}

// 1. Floor 1: Kebutuhan & Sembako (Modern Minimalist Retail Bag / Grocery Grid)
export const Floor1Icon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 8.5C4 7.39543 4.89543 6.5 6 6.5H18C19.1046 6.5 20 7.39543 20 8.5V18C20 19.6569 18.6569 21 17 21H7C5.34315 21 4 19.6569 4 18V8.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 6.5V5C8.5 3.34315 9.84315 2 11.5 2H12.5C14.1569 2 15.5 3.34315 15.5 5V6.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="13.5" r="2.5" stroke="currentColor" strokeWidth="2" />
    <path d="M12 11V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 2. Floor 2: Pakaian & Fashion (Modern Garment Silhouette & Hanger Glyph)
export const Floor2Icon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C13.1046 2 14 2.89543 14 4C14 4.74028 13.5978 5.38663 13 5.73242V7.5L20.25 10.75C21.2 11.2 21.3 12.3 20.6 13L19 14.5L16.5 13V21C16.5 21.5523 16.0523 22 15.5 22H8.5C7.94772 22 7.5 21.5523 7.5 21V13L5 14.5L3.4 13C2.7 12.3 2.8 11.2 3.75 10.75L11 7.5V5.73242C10.4022 5.38663 10 4.74028 10 4C10 2.89543 10.8954 2 12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11.5L14 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 3. Floor 3: Perabotan & Home Living (Minimalist Scandinavian Lounge Chair)
export const Floor3Icon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M6 19H18M7 19L5.5 22M17 19L18.5 22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 14C4 12.8954 4.89543 12 6 12H18C19.1046 12 20 12.8954 20 14V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V14Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M6 12V6.5C6 4.567 7.567 3 9.5 3H14.5C16.433 3 18 4.567 18 6.5V12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// 4. Floor 4: Gudang & Bulk Stock (Tiered Logistics Storage & Pallet Stack)
export const Floor4Icon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2.5L21 7.5L12 12.5L3 7.5L12 2.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 12.5L12 17.5L21 12.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 17.5L12 22.5L21 17.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Unified Floor Icon Resolver with bespoke styled floor badge
export const FloorGlyph: React.FC<{ floorId: FloorId; size?: number; className?: string }> = ({
  floorId,
  size = 18,
  className = '',
}) => {
  switch (floorId) {
    case '1':
      return <Floor1Icon size={size} className={className} />;
    case '2':
      return <Floor2Icon size={size} className={className} />;
    case '3':
      return <Floor3Icon size={size} className={className} />;
    case '4':
      return <Floor4Icon size={size} className={className} />;
    default:
      return <Floor1Icon size={size} className={className} />;
  }
};

// High-Tech Barcode Viewfinder Icon
export const ScannerGlyph: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 8V5C4 4.44772 4.44772 4 5 4H8M16 4H19C19.5523 4 20 4.44772 20 5V8M20 16V19C20 19.5523 19.5523 20 19 20H16M8 20H5C4.44772 20 4 19.5523 4 19V16"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

// Premium Executive Admin Crest Icon
export const AdminCrestGlyph: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Refined Shield Contour */}
    <path
      d="M12 2.5L4.5 5.8V11.5C4.5 16.5 7.7 20.8 12 22C16.3 20.8 19.5 16.5 19.5 11.5V5.8L12 2.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Executive Crown & Star Accent */}
    <path
      d="M8.5 14L10 9.5L12 11.5L14 9.5L15.5 14H8.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="7.2" r="1.1" fill="currentColor" />
  </svg>
);
