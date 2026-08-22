import React from 'react';
import { Home, LogOut } from 'lucide-react';
import type { FloorId, UserAccount } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { FloorGlyph, AdminCrestGlyph } from './CustomIcons';

export type NavTab = 'home' | FloorId | 'admin';

interface LiquidNavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lowStockCounts?: Record<FloorId, number>;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
}

export const LiquidNavbar: React.FC<LiquidNavbarProps> = ({
  activeTab,
  onSelectTab,
  lowStockCounts = { '1': 0, '2': 0, '3': 0, '4': 0 },
  currentUser = StockStorageEngine.getCurrentUser(),
  onLogout,
}) => {
  const isFahriAdmin = Boolean(
    currentUser &&
      (currentUser.username.toLowerCase() === 'fahri' ||
        currentUser.name.toLowerCase() === 'fahri' ||
        currentUser.role === 'ADMIN')
  );

  const hasAllFloors =
    isFahriAdmin || (currentUser && currentUser.assignedFloors.length >= 4);

  const allTabs: {
    id: NavTab;
    label: string;
    icon: React.FC<{ size?: number; className?: string; isActive?: boolean }>;
    badge?: number;
    accessCheck: () => boolean;
  }[] = [
    {
      id: 'home',
      label: 'Beranda',
      icon: ({ size = 18, className = '' }) => <Home size={size} className={className} />,
      accessCheck: () => !currentUser || Boolean(hasAllFloors),
    },
    {
      id: '1',
      label: 'Lt 1',
      icon: ({ size = 18, className = '' }) => <FloorGlyph floorId="1" size={size} className={className} />,
      badge: lowStockCounts['1'] > 0 ? lowStockCounts['1'] : undefined,
      accessCheck: () =>
        !currentUser ||
        isFahriAdmin ||
        currentUser.assignedFloors.includes('1'),
    },
    {
      id: '2',
      label: 'Lt 2',
      icon: ({ size = 18, className = '' }) => <FloorGlyph floorId="2" size={size} className={className} />,
      badge: lowStockCounts['2'] > 0 ? lowStockCounts['2'] : undefined,
      accessCheck: () =>
        !currentUser ||
        isFahriAdmin ||
        currentUser.assignedFloors.includes('2'),
    },
    {
      id: '3',
      label: 'Lt 3',
      icon: ({ size = 18, className = '' }) => <FloorGlyph floorId="3" size={size} className={className} />,
      badge: lowStockCounts['3'] > 0 ? lowStockCounts['3'] : undefined,
      accessCheck: () =>
        !currentUser ||
        isFahriAdmin ||
        currentUser.assignedFloors.includes('3'),
    },
    {
      id: '4',
      label: 'Lt 4',
      icon: ({ size = 18, className = '' }) => <FloorGlyph floorId="4" size={size} className={className} />,
      badge: lowStockCounts['4'] > 0 ? lowStockCounts['4'] : undefined,
      accessCheck: () =>
        !currentUser ||
        isFahriAdmin ||
        currentUser.assignedFloors.includes('4'),
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: ({ size = 18, className = '' }) => <AdminCrestGlyph size={size} className={className} />,
      accessCheck: () => isFahriAdmin,
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.accessCheck());
  const activeIndex = Math.max(
    0,
    visibleTabs.findIndex((t) => t.id === activeTab)
  );

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-40 max-w-sm mx-auto px-3 pointer-events-none">
      <div className="pointer-events-auto bg-zinc-950/90 text-white rounded-2xl p-1 shadow-2xl backdrop-blur-xl border border-zinc-800/80 flex items-center justify-between relative overflow-hidden">
        {/* Animated Active Sliding Indicator */}
        <div
          className="absolute top-1 bottom-1 bg-zinc-800 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
          style={{
            width: `${100 / (visibleTabs.length + (onLogout ? 1 : 0))}%`,
            left: `${(activeIndex * 100) / (visibleTabs.length + (onLogout ? 1 : 0))}%`,
          }}
        />

        {/* Tab Buttons */}
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative z-10 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 touch-press flex-1 ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <IconComponent
                  size={17}
                  className={`transition-all duration-200 ${
                    isActive ? 'scale-110 text-white' : 'scale-100 text-zinc-400'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[12px] h-3 text-[8px] font-extrabold bg-amber-400 text-black rounded-full flex items-center justify-center leading-none shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={() => {
              soundEffects.playLockSound();
              onLogout();
            }}
            className="relative z-10 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-zinc-400 hover:text-white transition-all duration-200 touch-press flex-1"
            title="Keluar"
          >
            <LogOut size={16} className="text-zinc-400 hover:text-white" />
            <span className="text-[9px] tracking-tight mt-0.5 leading-none text-zinc-400">
              Keluar
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
