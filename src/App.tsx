import React, { useState, useEffect, useCallback } from 'react';
import type { FloorId, UserAccount } from './types/stock';
import { StockStorageEngine } from './services/db';
import type { NavTab } from './components/LiquidNavbar';
import { LiquidNavbar } from './components/LiquidNavbar';
import { LoginPage } from './views/LoginPage';
import { LandingPage } from './views/LandingPage';
import { FloorView } from './views/FloorView';
import { AdminDashboard } from './views/AdminDashboard';
import { soundEffects } from './utils/audio';
import { App as CapApp } from '@capacitor/app';
import { backButtonManager } from './utils/modalManager';
import { ExitConfirmModal } from './components/ExitConfirmModal';

import { AutoBackupReceiverModal } from './components/AutoBackupReceiverModal';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    StockStorageEngine.getCurrentUser()
  );
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const getInitialTab = (user: UserAccount | null): NavTab => {
    if (!user) return 'home';
    if (user.role === 'ADMIN' || user.assignedFloors.length >= 4) {
      return 'home';
    }
    if (user.assignedFloors.length > 0) {
      return user.assignedFloors[0];
    }
    return 'home';
  };

  const [activeTab, setActiveTab] = useState<NavTab>(() => getInitialTab(currentUser));

  const [lowStockCounts, setLowStockCounts] = useState<Record<FloorId, number>>({
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
  });

  const computeBadges = useCallback(() => {
    const counts: Record<FloorId, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
    (['1', '2', '3', '4'] as FloorId[]).forEach((fId) => {
      const data = StockStorageEngine.getFloorData(fId);
      const count = data.items.filter((it) => it.quantity <= it.minStock).length;
      counts[fId] = count;
    });
    setLowStockCounts(counts);
  }, []);

  // Enforce access control guard on activeTab
  useEffect(() => {
    if (currentUser) {
      const isFahriAdmin =
        currentUser.username.toLowerCase() === 'fahri' ||
        currentUser.name.toLowerCase() === 'fahri' ||
        currentUser.role === 'ADMIN';

      if (activeTab === 'admin' && !isFahriAdmin) {
        setActiveTab(currentUser.assignedFloors[0] || '1');
      } else if (
        activeTab === 'home' &&
        !isFahriAdmin &&
        currentUser.assignedFloors.length < 4
      ) {
        setActiveTab(currentUser.assignedFloors[0] || '1');
      } else if (
        activeTab !== 'home' &&
        activeTab !== 'admin' &&
        !isFahriAdmin &&
        !currentUser.assignedFloors.includes(activeTab as FloorId)
      ) {
        setActiveTab(currentUser.assignedFloors[0] || '1');
      }
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    computeBadges();
    const handleStorageUpdate = () => computeBadges();
    const handleUserChanged = (e: Event) => {
      const custom = e as CustomEvent<{ user: UserAccount | null }>;
      const newUser = custom.detail?.user || null;
      setCurrentUser(newUser);
      if (newUser) {
        setActiveTab(getInitialTab(newUser));
      }
    };

    window.addEventListener('istiqomah_stock_updated', handleStorageUpdate);
    window.addEventListener('istiqomah_user_changed', handleUserChanged);
    return () => {
      window.removeEventListener('istiqomah_stock_updated', handleStorageUpdate);
      window.removeEventListener('istiqomah_user_changed', handleUserChanged);
    };
  }, [computeBadges]);

  // Configure Android Hardware Back Button & Web PopState Navigation
  useEffect(() => {
    backButtonManager.setNavigationHandlers(
      () => activeTab === 'home',
      () => {
        soundEffects.playClickSound();
        setActiveTab('home');
      },
      () => setIsExitModalOpen(true)
    );
  }, [activeTab]);

  useEffect(() => {
    let capListener: { remove: () => void } | null = null;
    CapApp.addListener('backButton', () => {
      backButtonManager.handleBack();
    }).then((listener) => {
      capListener = listener;
    });

    const handlePopState = () => {
      backButtonManager.handleBack();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      if (capListener) capListener.remove();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    const targetTab = getInitialTab(user);
    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    soundEffects.playLockSound();
    StockStorageEngine.setCurrentUser(null);
    sessionStorage.clear();
    setCurrentUser(null);
  };

  const handleSelectTab = (tab: NavTab) => {
    soundEffects.playClickSound();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not logged in, render the clean professional LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans selection:bg-zinc-200">
      {/* Top Mobile Border Accent */}
      <div className="h-0.5 bg-black w-full" />

      {/* Main View Container */}
      <main className="w-full">
        {activeTab === 'home' ? (
          <LandingPage
            onSelectFloor={(fId) => handleSelectTab(fId)}
            onOpenAdmin={() => handleSelectTab('admin')}
          />
        ) : activeTab === 'admin' ? (
          <AdminDashboard onSelectFloor={(fId) => handleSelectTab(fId)} />
        ) : (
          <FloorView
            key={activeTab}
            floorId={activeTab as FloorId}
            onOpenAdmin={() => handleSelectTab('admin')}
          />
        )}
      </main>

      {/* Animated Floating Pill Dock (strictly filtered to authorized tabs) */}
      <LiquidNavbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        lowStockCounts={lowStockCounts}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      {/* Auto Backup Receiver Modal (for Telegram Shares, Drops, & Files) */}
      <AutoBackupReceiverModal />

      {/* Android Hardware Back Button Exit Prompt */}
      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
      />
    </div>
  );
};

export default App;
