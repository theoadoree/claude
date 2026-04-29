/**
 * BackgroundLocationTask.ts
 *
 * IMPORTANT: TaskManager.defineTask MUST be called at the top-level module scope
 * (not inside a component or function). This file must be imported in index.ts
 * BEFORE registerRootComponent so the task is registered before Expo needs it.
 */
import * as TaskManager from 'expo-task-manager';
import * as ExpoLocation from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BACKGROUND_LOCATION_TASK = 'taxtrack-background-location';
export const LOCATION_ENTRIES_KEY = '@taxtracker/location_entries';

// ─── Reverse-geocode helper (no external API, uses Expo's geocoder) ────────────
async function reverseGeocodeCoords(lat: number, lon: number) {
  try {
    const results = await ExpoLocation.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (results.length > 0) {
      const r = results[0];
      return {
        city: r.city || r.district || r.subregion || undefined,
        state: r.region || undefined,
        country: r.country || undefined,
        jurisdictionName: r.region || r.country || undefined,
      };
    }
  } catch (_) {}
  return {};
}

// ─── Persist a location entry for today ───────────────────────────────────────
async function persistTodayLocation(lat: number, lon: number) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const geo = await reverseGeocodeCoords(lat, lon);

    const raw = await AsyncStorage.getItem(LOCATION_ENTRIES_KEY);
    const entries: any[] = raw ? JSON.parse(raw) : [];

    // Check if today's entry already exists — update it
    const existingIdx = entries.findIndex((e: any) => e.date === today);
    const now = new Date().toISOString();

    const updatedEntry = {
      id: existingIdx >= 0 ? entries[existingIdx].id : Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      date: today,
      jurisdictionName: geo.jurisdictionName,
      city: geo.city,
      state: geo.state,
      country: geo.country,
      coordinates: { latitude: lat, longitude: lon },
      activityType: 'unknown',
      isVerified: false,
      source: 'auto',
      // Keep manual notes if entry already exists
      notes: existingIdx >= 0 ? entries[existingIdx].notes : undefined,
      documents: existingIdx >= 0 ? entries[existingIdx].documents : [],
      createdAt: existingIdx >= 0 ? entries[existingIdx].createdAt : now,
      updatedAt: now,
      // Track the last known coordinates for background update
      lastCoordinates: { latitude: lat, longitude: lon, timestamp: now },
    };

    if (existingIdx >= 0) {
      entries[existingIdx] = updatedEntry;
    } else {
      entries.push(updatedEntry);
    }

    await AsyncStorage.setItem(LOCATION_ENTRIES_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('[BackgroundLocationTask] persist error:', e);
  }
}

// ─── Register the background task ─────────────────────────────────────────────
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[BackgroundLocationTask] error:', error);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: ExpoLocation.LocationObject[] };
  if (!locations || locations.length === 0) return;

  // Use the most recent location
  const latest = locations[locations.length - 1];
  const { latitude, longitude } = latest.coords;

  await persistTodayLocation(latitude, longitude);
});
