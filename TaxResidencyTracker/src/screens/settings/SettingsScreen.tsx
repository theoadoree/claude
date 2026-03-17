import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAppStore } from '../../store';
import {
  startBackgroundTracking,
  stopBackgroundTracking,
  isTrackingActive,
  requestDisableBatteryOptimization,
  showIosLowPowerModeWarning,
} from '../../services/BackgroundLocationService';

function SettingRow({
  icon, color, label, subtitle, value, onPress, rightComponent, chevron = true,
}: {
  icon: string; color: string; label: string; subtitle?: string;
  value?: string; onPress?: () => void; rightComponent?: React.ReactNode; chevron?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          {chevron && <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { userProfile, updateUserProfile, jurisdictions, yearSummary, clearAll, selectedYear } = useAppStore();
  const [trackingLive, setTrackingLive] = useState(false);

  useEffect(() => {
    isTrackingActive().then(setTrackingLive);
  }, []);

  const handleTrackingToggle = async (value: boolean) => {
    await updateUserProfile({ trackingEnabled: value });
    if (value) {
      const started = await startBackgroundTracking();
      setTrackingLive(started);
      if (started) {
        if (Platform.OS === 'android') requestDisableBatteryOptimization();
        if (Platform.OS === 'ios') showIosLowPowerModeWarning();
      }
    } else {
      await stopBackgroundTracking();
      setTrackingLive(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your location entries, documents, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
          },
        },
      ]
    );
  };

  const toggleTracking = async (value: boolean) => {
    await updateUserProfile({ trackingEnabled: value });
  };

  const toggleNotifications = async (value: boolean) => {
    await updateUserProfile({ notificationsEnabled: value });
  };

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Profile summary */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={28} color={Colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userProfile?.name || 'Tax Tracker User'}
              </Text>
              <Text style={styles.profileMeta}>
                {jurisdictions.length} jurisdiction{jurisdictions.length !== 1 ? 's' : ''} tracked
                {' • '}{selectedYear}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Days Tracked', value: yearSummary?.totalDaysTracked.toString() || '0' },
              { label: 'Missing Days', value: yearSummary?.missingDays.toString() || '0' },
              { label: 'Jurisdictions', value: jurisdictions.length.toString() },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Tracking */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracking</Text>
            <View style={styles.sectionCard}>
              <SettingRow
                icon="location"
                color={Colors.primary}
                label="Background Tracking"
                subtitle={trackingLive ? '🟢 Active — logging every 5 min' : 'Auto-detect jurisdiction every 5 minutes'}
                chevron={false}
                rightComponent={
                  <Switch
                    value={userProfile?.trackingEnabled ?? false}
                    onValueChange={handleTrackingToggle}
                    trackColor={{ false: Colors.backgroundTertiary, true: Colors.primary + '50' }}
                    thumbColor={userProfile?.trackingEnabled ? Colors.primary : Colors.textTertiary}
                  />
                }
              />
              <View style={styles.separator} />
              {Platform.OS === 'android' && (
                <>
                  <SettingRow
                    icon="battery-charging"
                    color={Colors.accent}
                    label="Battery Optimization"
                    subtitle="Disable to ensure 5-min tracking works"
                    onPress={requestDisableBatteryOptimization}
                  />
                  <View style={styles.separator} />
                </>
              )}
              {Platform.OS === 'ios' && (
                <>
                  <SettingRow
                    icon="battery-half"
                    color={Colors.accent}
                    label="Low Power Mode"
                    subtitle="Disable for uninterrupted 5-min tracking"
                    onPress={showIosLowPowerModeWarning}
                  />
                  <View style={styles.separator} />
                </>
              )}
              <SettingRow
                icon="notifications"
                color={Colors.riskModerate}
                label="Day Limit Alerts"
                subtitle="Warn when approaching jurisdiction limits"
                chevron={false}
                rightComponent={
                  <Switch
                    value={userProfile?.notificationsEnabled ?? false}
                    onValueChange={async (v) => updateUserProfile({ notificationsEnabled: v })}
                    trackColor={{ false: Colors.backgroundTertiary, true: Colors.primary + '50' }}
                    thumbColor={userProfile?.notificationsEnabled ? Colors.primary : Colors.textTertiary}
                  />
                }
              />
            </View>
          </View>

          {/* Jurisdictions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Jurisdictions</Text>
            <View style={styles.sectionCard}>
              <SettingRow
                icon="map"
                color={Colors.primary}
                label="Manage Jurisdictions"
                subtitle={`${jurisdictions.length} tracked`}
                onPress={() => navigation.navigate('ManageJurisdictions')}
              />
            </View>
          </View>

          {/* Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <View style={styles.sectionCard}>
              <SettingRow
                icon="cloud-upload"
                color={Colors.secondary}
                label="Import Monaeo CSV"
                subtitle="Import location history from Monaeo export"
                onPress={() => navigation.navigate('ImportData')}
              />
              <View style={styles.separator} />
              <SettingRow
                icon="server"
                color={Colors.primary}
                label="Backup & Restore"
                subtitle="iCloud / Google Drive backup + local snapshots"
                onPress={() => navigation.navigate('Backup')}
              />
              <View style={styles.separator} />
              <SettingRow
                icon="document-text"
                color={Colors.accent}
                label="Generate Tax Report"
                subtitle="Create a summary PDF for your tax professional"
                onPress={() => Alert.alert('Report', 'PDF report generation coming soon')}
              />
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.sectionCard}>
              <SettingRow
                icon="shield-checkmark"
                color={Colors.secondary}
                label="Privacy Policy"
                subtitle="Your data never leaves your device"
                onPress={() => {}}
              />
              <View style={styles.separator} />
              <SettingRow
                icon="information-circle"
                color={Colors.primary}
                label="Version"
                value="1.0.0"
                chevron={false}
              />
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.disclaimerText}>
              TaxTrack is a record-keeping tool. It does not provide tax advice. Always consult a qualified tax professional regarding your specific situation.
            </Text>
          </View>

          {/* Danger zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.riskHigh }]}>Danger Zone</Text>
            <View style={styles.sectionCard}>
              <SettingRow
                icon="trash"
                color={Colors.riskHigh}
                label="Clear All Data"
                subtitle="Permanently delete all your data"
                onPress={handleClearData}
              />
            </View>
          </View>

          <View style={{ height: Spacing['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, letterSpacing: -0.5 },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(10,132,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  profileMeta: { fontSize: Typography.sm, color: Colors.textTertiary, marginTop: 3 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2, textAlign: 'center' },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: Typography.semibold,
    paddingHorizontal: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: 56 },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: { flex: 1 },
  settingLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  settingSubtitle: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 1 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  settingValue: { fontSize: Typography.sm, color: Colors.textTertiary },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  disclaimerText: { flex: 1, fontSize: Typography.xs, color: Colors.textTertiary, lineHeight: 16, fontStyle: 'italic' },
});
