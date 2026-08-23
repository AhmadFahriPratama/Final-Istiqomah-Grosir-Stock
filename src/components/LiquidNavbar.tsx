import React, { useState } from 'react';
import { Home, LogOut } from 'lucide-react';
import type { FloorId, UserAccount } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { FloorGlyph, AdminCrestGlyph } from './CustomIcons';
import { LogoutConfirmModal } from './LogoutConfirmModal';

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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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
  const totalSlots = visibleTabs.length + (onLogout ? 1 : 0);
  const activeIndex = Math.max(
    0,
    visibleTabs.findIndex((t) => t.id === activeTab)
  );

  return (
    <>
      <nav className="fixed bottom-4 left-0 right-0 z-40 max-w-sm mx-auto px-3 pointer-events-none">
        <div
          className="relative pointer-events-auto bg-[#faf5e8]/95 text-[#2a1a10] rounded-2xl shadow-xl backdrop-blur-xl border-2 border-[#2a1a10] grid items-center overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${totalSlots}, minmax(0, 1fr))`,
          }}
        >
          {/* Pixel-Perfect Sliding Liquid Pill */}
          <div
            className="absolute inset-y-0 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none p-1"
            style={{
              width: `${100 / totalSlots}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          >
            <div className="w-full h-full bg-[#2a1a10] rounded-xl shadow-xs" />
          </div>

          {/* Tab Buttons */}
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative z-10 flex flex-col items-center justify-center py-2.5 px-0.5 rounded-xl transition-colors duration-200 touch-press w-full select-none ${
                  isActive
                    ? 'text-[#faf5e8]'
                    : 'text-[#78604d] hover:text-[#2a1a10]'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <IconComponent
                    size={17}
                    className={`transition-transform duration-200 ${
                      isActive ? 'scale-110 text-[#faf5e8]' : 'scale-100 text-[#78604d]'
                    }`}
                  />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 px-1 min-w-[12px] h-3 text-[8px] font-bold bg-[#c56f1f] text-white rounded-full flex items-center justify-center leading-none shadow-xs">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 leading-none transition-colors duration-200 ${
                    isActive ? 'font-semibold text-[#faf5e8]' : 'font-medium text-[#78604d]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setIsLogoutModalOpen(true);
              }}
              className="relative z-10 flex flex-col items-center justify-center py-2.5 px-0.5 rounded-xl text-[#9e8b74] hover:text-[#a83535] hover:bg-[#fdf1f1]/60 transition-colors touch-press w-full select-none"
              title="Keluar"
            >
              <LogOut size={16} />
              <span className="text-[9px] mt-0.5 leading-none font-medium">
                Keluar
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        userName={currentUser?.name || currentUser?.username || 'Petugas'}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          onLogout?.();
        }}
      />
    </>
  );
};
