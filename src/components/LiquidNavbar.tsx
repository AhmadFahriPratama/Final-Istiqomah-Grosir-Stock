import React from 'react';
import {
  Home,
  ShoppingBag,
  Shirt,
  Armchair,
  Package,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import type { FloorId, UserAccount } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';

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
  const isFahriAdmin =
    Boolean(
      currentUser &&
        (currentUser.username.toLowerCase() === 'fahri' ||
          currentUser.name.toLowerCase() === 'fahri' ||
          currentUser.role === 'ADMIN')
    );

  const hasAllFloors =
    isFahriAdmin || (currentUser && currentUser.assignedFloors.length >= 4);

  const allTabs = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      icon: Home,
      // Home is only shown for Admin or staff with access to all 4 floors
      accessCheck: () => !currentUser || hasAllFloors,
    },
    {
      id: '1' as NavTab,
      label: 'Lt 1',
      icon: ShoppingBag,
      badge: lowStockCounts['1'] > 0 ? lowStockCounts['1'] : undefined,
      accessCheck: () =>
        !currentUser ||
        isFahriAdmin ||
        currentUser.assignedFloors.includes('1'),
    },
    {
      id: '2' as NavTab,
      label: 'Lt 2',
      icon: Shirt,
      badge: lowStockCounts['2'] > 0 ? lowStockCounts['2'] : undefined,
      accessCheck: () =>
        !currentUser ||
        isFahriAdmin ||
        currentUser.assignedFloors.includes('2'),
    },
    {
      id: '3' as NavTab,
      label: 'Lt 3',
      icon: Armchair,
      badge: lowStockCounts['3'] > 0 ? lowStockCounts['3'] : undefined,
      accessCheck: () =>
        !currentUser ||
        isFahriAdmin ||
        currentUser.assignedFloors.includes('3'),
    },
    {
      id: '4' as NavTab,
      label: 'Lt 4',
      icon: Package,
      badge: lowStockCounts['4'] > 0 ? lowStockCounts['4'] : undefined,
      accessCheck: () =>
        !currentUser ||
        isFahriAdmin ||
        currentUser.assignedFloors.includes('4'),
    },
    {
      id: 'admin' as NavTab,
      label: 'Admin',
      icon: ShieldCheck,
      // Khusus akun Fahri
      accessCheck: () => isFahriAdmin,
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.accessCheck());
  const activeIndex = Math.max(
    0,
    visibleTabs.findIndex((t) => t.id === activeTab)
  );

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-40 max-w-sm mx-auto px-4 pointer-events-none">
      <div className="pointer-events-auto bg-black/95 text-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl border border-zinc-800 flex items-center justify-between relative overflow-hidden">
        {/* Animated Magnetic Sliding Active Backdrop Pill */}
        <div
          className="absolute top-1.5 bottom-1.5 bg-zinc-800 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] pointer-events-none"
          style={{
            width: `${100 / (visibleTabs.length + (onLogout ? 1 : 0))}%`,
            left: `${(activeIndex * 100) / (visibleTabs.length + (onLogout ? 1 : 0))}%`,
          }}
        />

        {/* Tab Buttons */}
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

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
              <div className="relative">
                <Icon
                  size={17}
                  className={`transition-all duration-200 ${
                    isActive ? 'scale-110 text-white stroke-[2.5]' : 'scale-100 text-zinc-400'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[13px] text-[8px] font-bold bg-white text-black rounded-full text-center leading-tight">
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

        {/* Logout / Switch User Button */}
        {onLogout && (
          <button
            onClick={() => {
              soundEffects.playLockSound();
              onLogout();
            }}
            className="relative z-10 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-zinc-400 hover:text-white transition-all duration-200 touch-press flex-1"
            title="Keluar / Ganti Akun"
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
