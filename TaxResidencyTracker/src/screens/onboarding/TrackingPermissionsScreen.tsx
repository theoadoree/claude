import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, JURISDICTION_COLORS } from '../../theme';
import { useAppStore } from '../../store';
import { locationService } from '../../services/LocationService';

const PERMISSIONS_INFO = [
  {
    icon: 'location',
    title: 'Location (Always)',
    description: 'Required to track which jurisdiction you\'re in throughout the day, even when the app is in the background.',
    required: true,
  },
  {
    icon: 'notifications',
    title: 'Notifications',
    description: 'Alerts when you\'re approaching day limits in high-tax jurisdictions.',
    required: false,
  },
];

export default function TrackingPermissionsScreen({ navigation, route }: any) {
  const { primaryJurisdiction, watchedJurisdictions = [] } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const { setUserProfile, addJurisdiction } = useAppStore();

  const handleGrantPermissions = async () => {
    setIsLoading(true);
    try {
      await locationService.requestPermissions();
    } catch (e) {
      // Continue even if permissions denied
    }
    await completeOnboarding();
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Create primary jurisdiction
      let primaryJurisdictionId: string | undefined;
      if (primaryJurisdiction) {
        const pj = await addJurisdiction({
          name: primaryJurisdiction.name,
          type: 'state',
          country: primaryJurisdiction.country,
          state: primaryJurisdiction.state,
          color: JURISDICTION_COLORS[0],
          isPrimary: true,
          isTracked: true,
        });
        primaryJurisdictionId = pj.id;
      }

      // Create watched jurisdictions
      for (let i = 0; i < watchedJurisdictions.length; i++) {
        const wj = watchedJurisdictions[i];
        if (wj.name !== primaryJurisdiction?.name) {
          await addJurisdiction({
            name: wj.name,
            type: wj.state ? 'state' : 'country',
            country: wj.country,
            state: wj.state,
            color: JURISDICTION_COLORS[(i + 1) % JURISDICTION_COLORS.length],
            isPrimary: false,
            isTracked: true,
          });
        }
      }

      // Set user profile as onboarding complete
      await setUserProfile({
        id: Math.random().toString(36).substr(2, 9),
        primaryJurisdictionId,
        trackedJurisdictionIds: [],
        onboardingCompleted: true,
        taxYear: new Date().getFullYear(),
        trackingEnabled: true,
        trackingFrequency: 'hourly',
        notificationsEnabled: true,
        notificationThresholds: [],
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Onboarding error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0C0C0E', '#0F1923', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.progress}>
            <View style={[styles.progressDot, styles.progressDotDone]} />
            <View style={[styles.progressLine, styles.progressLineDone]} />
            <View style={[styles.progressDot, styles.progressDotDone]} />
            <View style={[styles.progressLine, styles.progressLineDone]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.iconGradient}>
              <Ionicons name="shield-checkmark" size={40} color={Colors.white} />
            </LinearGradient>
          </View>

          <Text style={styles.step}>Step 3 of 3</Text>
          <Text style={styles.title}>Enable tracking</Text>
          <Text style={styles.subtitle}>
            TaxTrack uses your device's location to automatically log which jurisdiction you're in.
            Your data stays on your device — it's never uploaded to our servers.
          </Text>

          {/* Permissions */}
          <View style={styles.permissions}>
            {PERMISSIONS_INFO.map((p, i) => (
              <View key={i} style={styles.permissionItem}>
                <View style={styles.permissionIcon}>
                  <Ionicons name={p.icon as any} size={20} color={Colors.primary} />
                </View>
                <View style={styles.permissionText}>
                  <View style={styles.permissionTitleRow}>
                    <Text style={styles.permissionTitle}>{p.title}</Text>
                    {p.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredBadgeText}>Required</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.permissionDesc}>{p.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Privacy note */}
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={14} color={Colors.secondary} />
            <Text style={styles.privacyText}>
              100% private. All data stored locally on your device using encrypted storage.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleGrantPermissions}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={Colors.gradientPrimary} style={styles.primaryBtnGradient}>
              <Ionicons name="location" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>
                {isLoading ? 'Setting up...' : 'Enable Location Tracking'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={styles.skipBtnText}>Set up manually later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.backgroundTertiary },
  progressDotActive: { backgroundColor: Colors.primary },
  progressDotDone: { backgroundColor: Colors.secondary },
  progressLine: { width: 24, height: 2, backgroundColor: Colors.backgroundTertiary },
  progressLineDone: { backgroundColor: Colors.secondary },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  iconContainer: { alignItems: 'center' },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  permissions: { gap: Spacing.md },
  permissionItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(10,132,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: { flex: 1 },
  permissionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  permissionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  requiredBadge: {
    backgroundColor: 'rgba(10,132,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredBadgeText: { fontSize: 9, color: Colors.primary, fontWeight: Typography.semibold, textTransform: 'uppercase' },
  permissionDesc: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 16 },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(48,209,88,0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.2)',
  },
  privacyText: { flex: 1, fontSize: Typography.xs, color: Colors.secondary, lineHeight: 16 },
  footer: {
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  primaryBtn: { borderRadius: BorderRadius.base, overflow: 'hidden' },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  primaryBtnText: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.white },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipBtnText: { fontSize: Typography.sm, color: Colors.textTertiary },
});
