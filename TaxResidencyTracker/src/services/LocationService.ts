import * as ExpoLocation from 'expo-location';
import { LocationEntry } from '../types';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  jurisdictionName?: string;
}

class LocationService {
  private watchSubscription: ExpoLocation.LocationSubscription | null = null;
  private lastKnownLocation: LocationData | null = null;

  async requestPermissions(): Promise<boolean> {
    const { status: foreground } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (foreground !== 'granted') return false;

    // Request background permissions for continuous tracking
    const { status: background } = await ExpoLocation.requestBackgroundPermissionsAsync();
    return background === 'granted' || foreground === 'granted';
  }

  async checkPermissions(): Promise<{
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

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const geocoded = await this.reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      );

      this.lastKnownLocation = geocoded;
      return geocoded;
    } catch (e) {
      console.error('LocationService.getCurrentLocation error:', e);
      return null;
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<LocationData> {
    try {
      const results = await ExpoLocation.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (results.length > 0) {
        const r = results[0];
        const city = r.city || r.district || r.subregion || undefined;
        const state = r.region || undefined;
        const country = r.country || undefined;

        return {
          latitude: lat,
          longitude: lon,
          city,
          state,
          country,
          jurisdictionName: state || city || country,
        };
      }
    } catch (e) {
      console.error('Reverse geocode error:', e);
    }
    return { latitude: lat, longitude: lon };
  }

  startContinuousTracking(
    onLocation: (data: LocationData) => void,
    intervalMinutes: number = 60
  ): void {
    this.stopTracking();
    ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.Low,
        distanceInterval: 5000, // 5km
        timeInterval: intervalMinutes * 60 * 1000,
      },
      async (location) => {
        const data = await this.reverseGeocode(
          location.coords.latitude,
          location.coords.longitude
        );
        this.lastKnownLocation = data;
        onLocation(data);
      }
    ).then((sub) => {
      this.watchSubscription = sub;
    });
  }

  stopTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }
}

export const locationService = new LocationService();
