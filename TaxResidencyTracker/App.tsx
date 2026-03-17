import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Platform, AppState } from 'react-native';
import AppNavigator from './src/navigation';
import { useAppStore } from './src/store';
import { Colors } from './src/theme';
import {
  startBackgroundTracking,
  requestDisableBatteryOptimization,
  isTrackingActive,
} from './src/services/BackgroundLocationService';
import { performAutoBackup } from './src/services/CloudBackupService';

function AppContent() {
  const { hydrate, hasHydrated, userProfile } = useAppStore();

  useEffect(() => {
    hydrate();
  }, []);

  // Once hydrated and onboarding complete, start services
  useEffect(() => {
    if (!hasHydrated || !userProfile?.onboardingCompleted) return;

    async function initServices() {
      // 1. Auto-backup on launch (runs silently in background)
      performAutoBackup().catch(() => {});

      // 2. Start 5-minute background location tracking
      if (userProfile?.trackingEnabled) {
        const alreadyRunning = await isTrackingActive();
        if (!alreadyRunning) {
          const started = await startBackgroundTracking();
          if (started && Platform.OS === 'android') {
            // Prompt Android users to disable battery optimization once
            requestDisableBatteryOptimization();
          }
        }
      }
    }

    initServices();
  }, [hasHydrated, userProfile?.onboardingCompleted, userProfile?.trackingEnabled]);

  // Re-check tracking on foreground resume (OS may have killed it)
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && userProfile?.trackingEnabled) {
        const running = await isTrackingActive();
        if (!running) {
          await startBackgroundTracking();
        }
        // Also do a backup whenever the app comes to foreground
        performAutoBackup().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [userProfile?.trackingEnabled]);

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
