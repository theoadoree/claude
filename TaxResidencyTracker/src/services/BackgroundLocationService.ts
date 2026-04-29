import * as ExpoLocation from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform, Alert, Linking } from 'react-native';
import { BACKGROUND_LOCATION_TASK } from './BackgroundLocationTask';

// 5 minutes in milliseconds
const TRACKING_INTERVAL_MS = 5 * 60 * 1000;

// ─── Permission helpers ────────────────────────────────────────────────────────
export async function requestAllLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  const fg = await ExpoLocation.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    return { foreground: false, background: false };
  }

  const bg = await ExpoLocation.requestBackgroundPermissionsAsync();
  return {
    foreground: true,
    background: bg.status === 'granted',
  };
}

export async function getLocationPermissionStatus(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  const fg = await ExpoLocation.getForegroundPermissionsAsync();
  const bg = await ExpoLocation.getBackgroundPermissionsAsync();
  return {
    foreground: fg.status === 'granted',
    background: bg.status === 'granted',
  };
}

// ─── Start continuous background tracking (every 5 minutes) ───────────────────
export async function startBackgroundTracking(): Promise<boolean> {
  try {
    const { foreground, background } = await getLocationPermissionStatus();
    if (!foreground) {
      console.warn('[BackgroundLocationService] No foreground permission');
      return false;
    }

    const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
    if (!isTaskDefined) {
      console.error('[BackgroundLocationService] Task not defined — ensure BackgroundLocationTask is imported in index.ts');
      return false;
    }

    const alreadyRunning = await ExpoLocation.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (alreadyRunning) return true;

    await ExpoLocation.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: ExpoLocation.Accuracy.Balanced,
      timeInterval: TRACKING_INTERVAL_MS,
      distanceInterval: 0, // Always update on timer regardless of movement
      pausesUpdatesAutomatically: false, // Never pause — critical for tax tracking
      showsBackgroundLocationIndicator: true, // iOS blue bar
      activityType: ExpoLocation.ActivityType.Other,
      // Android foreground service notification
      foregroundService: {
        notificationTitle: 'TaxTrack — Location Active',
        notificationBody: 'Logging jurisdiction every 5 minutes for tax compliance',
        notificationColor: '#0A84FF',
      },
      // Android: prevent Doze mode from killing location updates
      ...(Platform.OS === 'android' ? { deferredUpdatesDistance: 0, deferredUpdatesTimeout: TRACKING_INTERVAL_MS } : {}),
    });

    return true;
  } catch (e) {
    console.error('[BackgroundLocationService] startBackgroundTracking error:', e);
    return false;
  }
}

// ─── Stop tracking ─────────────────────────────────────────────────────────────
export async function stopBackgroundTracking(): Promise<void> {
  try {
    const isRunning = await ExpoLocation.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (isRunning) {
      await ExpoLocation.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch (e) {
    console.error('[BackgroundLocationService] stopBackgroundTracking error:', e);
  }
}

export async function isTrackingActive(): Promise<boolean> {
  return ExpoLocation.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
}

// ─── Battery optimization helpers ─────────────────────────────────────────────
/**
 * On Android: prompt the user to disable battery optimization for TaxTrack.
 * Battery optimization (Doze mode) can kill background location — we must ask
 * the user to exempt TaxTrack from battery optimization.
 */
export async function requestDisableBatteryOptimization(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // expo-intent-launcher is used to open the exact battery optimization settings
    const IntentLauncher = require('expo-intent-launcher');
    Alert.alert(
      'Disable Battery Optimization',
      'For accurate 5-minute location tracking, TaxTrack needs to be excluded from battery optimization. Tap "Allow" on the next screen.',
      [
        { text: 'Skip', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: async () => {
            try {
              // ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS opens directly for this app
              await IntentLauncher.startActivityAsync(
                'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
                { data: 'package:com.taxtrack.app' }
              );
            } catch (_) {
              // Fallback: open general battery optimization settings
              await IntentLauncher.startActivityAsync(
                'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS'
              );
            }
          },
        },
      ]
    );
  } catch (e) {
    console.warn('[BackgroundLocationService] battery optimization prompt error:', e);
  }
}

/**
 * On iOS: inform the user about Low Power Mode. We can't disable it
 * programmatically, but we can show a clear message.
 */
export function showIosLowPowerModeWarning(): void {
  if (Platform.OS !== 'ios') return;
  Alert.alert(
    'Low Power Mode',
    'iOS Low Power Mode reduces location update frequency. For accurate 5-minute tracking, please disable Low Power Mode in Settings → Battery.',
    [
      { text: 'Dismiss', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openURL('App-Prefs:Battery') },
    ]
  );
}
