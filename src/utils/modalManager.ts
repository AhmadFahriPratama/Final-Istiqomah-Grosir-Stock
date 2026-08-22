// Global Modal & Navigation Back-Button Dispatcher for Android and Web
import { useEffect } from 'react';

type CloseHandler = () => void;

interface ModalEntry {
  id: string;
  close: CloseHandler;
}

class BackButtonManager {
  private modalStack: ModalEntry[] = [];
  private onNavigateHome: (() => void) | null = null;
  private onShowExitPrompt: (() => void) | null = null;
  private isAtRootCheck: (() => boolean) | null = null;

  registerModal(id: string, close: CloseHandler) {
    this.unregisterModal(id);
    this.modalStack.push({ id, close });
    if (typeof window !== 'undefined') {
      window.history.pushState({ modalId: id }, '');
    }
  }

  unregisterModal(id: string) {
    this.modalStack = this.modalStack.filter((m) => m.id !== id);
  }

  setNavigationHandlers(
    isAtRoot: () => boolean,
    navigateHome: () => void,
    showExitPrompt: () => void
  ) {
    this.isAtRootCheck = isAtRoot;
    this.onNavigateHome = navigateHome;
    this.onShowExitPrompt = showExitPrompt;
  }

  handleBack(): boolean {
    // 1. Close topmost modal if any modal is open
    if (this.modalStack.length > 0) {
      const topModal = this.modalStack.pop();
      if (topModal) {
        try {
          topModal.close();
        } catch {
          // ignore
        }
        return true;
      }
    }

    // 2. If inside a subview (e.g. floor view or admin), navigate back to Home
    if (this.isAtRootCheck && !this.isAtRootCheck()) {
      if (this.onNavigateHome) {
        this.onNavigateHome();
        return true;
      }
    }

    // 3. If already at root with no modals open, show Exit confirmation prompt
    if (this.onShowExitPrompt) {
      this.onShowExitPrompt();
      return true;
    }

    return false;
  }
}

export const backButtonManager = new BackButtonManager();

/**
 * Hook to automatically register and unregister modals with the Android back button manager
 */
export function useRegisterModal(id: string, isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (isOpen) {
      backButtonManager.registerModal(id, onClose);
      return () => {
        backButtonManager.unregisterModal(id);
      };
    }
  }, [id, isOpen, onClose]);
}
