/**
 * Network Connectivity Service for Istiqomah Grosir Stock
 * Real-time, ultra-reliable online/offline detection with active probing.
 */

class NetworkServiceClass {
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isChecking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Browser standard events
      window.addEventListener('online', () => this.handleNetworkEvent(true));
      window.addEventListener('offline', () => this.handleNetworkEvent(false));

      // 2. Visibility change check (when user switches back to app)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.probeConnectivity();
        }
      });

      // 3. Initial probe
      setTimeout(() => this.probeConnectivity(), 100);

      // 4. Periodic heartbeat probe (every 4 seconds)
      setInterval(() => {
        this.probeConnectivity();
      }, 4000);
    }
  }

  private handleNetworkEvent(reportedOnline: boolean) {
    if (!reportedOnline) {
      this.updateStatus(false);
    } else {
      this.probeConnectivity();
    }
  }

  /**
   * Ultra-fast, lightweight connectivity probe with 2.5-second timeout.
   */
  async probeConnectivity(): Promise<boolean> {
    if (typeof window === 'undefined') return true;

    // If browser natively knows it's offline, avoid fetch
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateStatus(false);
      return false;
    }

    if (this.isChecking) return this.isOnlineState;
    this.isChecking = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      // Probe standard public endpoints with no-cors & cache bypass
      const probeUrl = `https://api.telegram.org/?_probe=${Date.now()}`;
      await fetch(probeUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.updateStatus(true);
      this.isChecking = false;
      return true;
    } catch {
      // Try secondary probe
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 2000);
        await fetch(`https://dns.google/resolve?name=example.com&_t=${Date.now()}`, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller2.signal,
        });
        clearTimeout(timeoutId2);
        this.updateStatus(true);
        this.isChecking = false;
        return true;
      } catch {
        this.updateStatus(false);
        this.isChecking = false;
        return false;
      }
    }
  }

  private updateStatus(newStatus: boolean) {
    const changed = this.isOnlineState !== newStatus;
    this.isOnlineState = newStatus;

    if (changed && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('istiqomah_network_status', {
          detail: { isOnline: newStatus },
        })
      );
    }
  }

  /**
   * Synchronous getter for current cached status
   */
  isOnline(): boolean {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    return this.isOnlineState;
  }

  /**
   * Asynchronous active check before critical network operations (e.g. backup)
   */
  async checkOnline(): Promise<boolean> {
    return await this.probeConnectivity();
  }
}

export const NetworkService = new NetworkServiceClass();
