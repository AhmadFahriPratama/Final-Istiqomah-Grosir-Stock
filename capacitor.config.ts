import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.istiqomah.grosirstock',
  appName: 'Istiqomah Grosir Stock',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
  },
};

export default config;
