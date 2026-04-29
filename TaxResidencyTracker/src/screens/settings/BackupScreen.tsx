import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import {
  listBackups,
  exportBackupToCloud,
  importBackupFromFile,
  restoreFromLocalBackup,
  performAutoBackup,
  BackupInfo,
} from '../../services/CloudBackupService';
import { useAppStore } from '../../store';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupScreen() {
  const navigation = useNavigation<any>();
  const { hydrate } = useAppStore();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const loadBackups = async () => {
    setIsLoading(true);
    const list = await listBackups();
    setBackups(list);
    setIsLoading(false);
  };

  useEffect(() => { loadBackups(); }, []);

  const handleManualBackup = async () => {
    setIsLoading(true);
    // Force a new backup by deleting today's (will be recreated)
    await performAutoBackup();
    await loadBackups();
    setIsLoading(false);
    Alert.alert('Backup Created', 'Your data has been backed up to device storage');
  };

  const handleExport = async () => {
    setIsExporting(true);
    const result = await exportBackupToCloud();
    setIsExporting(false);
    if (result.success) {
      Alert.alert('Export Ready', result.message);
    } else {
      Alert.alert('Export Failed', result.message);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    const result = await importBackupFromFile();
    setIsImporting(false);
    if (result.success) {
      await hydrate(); // Reload store from AsyncStorage
      Alert.alert('Restore Complete', `${result.message}. ${result.entriesRestored} location entries restored.`);
    } else {
      Alert.alert('Restore Failed', result.message);
    }
  };

  const handleRestoreLocal = (backup: BackupInfo) => {
    Alert.alert(
      'Restore Backup',
      `Restore from ${backup.date}? This will overwrite your current data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            const result = await restoreFromLocalBackup(backup.path);
            if (result.success) {
              await hydrate();
              Alert.alert('Restored', result.message);
            } else {
              Alert.alert('Failed', result.message);
            }
            setIsLoading(false);
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Backup & Restore</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* How it works */}
          <View style={styles.infoCard}>
            <Ionicons name="cloud" size={20} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>
                {Platform.OS === 'ios' ? 'iCloud Backup' : 'Google / Android Backup'}
              </Text>
              <Text style={styles.infoDesc}>
                {Platform.OS === 'ios'
                  ? 'TaxTrack automatically creates daily backups. These are included in iCloud Backup when enabled in your iPhone settings. Use "Export" to manually save to iCloud Drive.'
                  : 'TaxTrack automatically creates daily backups stored in app storage covered by Android Auto Backup. Use "Export" to manually save to Google Drive.'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={handleManualBackup} disabled={isLoading}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
                  <Ionicons name="save" size={22} color={Colors.secondary} />
                </View>
                <Text style={styles.actionLabel}>Backup Now</Text>
                <Text style={styles.actionDesc}>Save snapshot to device</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={handleExport} disabled={isExporting}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(10,132,255,0.15)' }]}>
                  {isExporting
                    ? <ActivityIndicator size="small" color={Colors.primary} />
                    : <Ionicons name="cloud-upload" size={22} color={Colors.primary} />}
                </View>
                <Text style={styles.actionLabel}>
                  {Platform.OS === 'ios' ? 'Export to iCloud' : 'Export to Drive'}
                </Text>
                <Text style={styles.actionDesc}>Share backup file</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={handleImport} disabled={isImporting}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,159,10,0.15)' }]}>
                  {isImporting
                    ? <ActivityIndicator size="small" color={Colors.accent} />
                    : <Ionicons name="cloud-download" size={22} color={Colors.accent} />}
                </View>
                <Text style={styles.actionLabel}>Import / Restore</Text>
                <Text style={styles.actionDesc}>Load from backup file</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Automatic backup schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Automatic Backups</Text>
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleRow}>
                <Ionicons name="time-outline" size={16} color={Colors.primary} />
                <Text style={styles.scheduleText}>Daily snapshot on app launch</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Ionicons name="repeat-outline" size={16} color={Colors.secondary} />
                <Text style={styles.scheduleText}>Last 7 daily backups kept on device</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
                <Text style={styles.scheduleText}>
                  {Platform.OS === 'ios'
                    ? 'Included in iCloud Backup automatically'
                    : 'Included in Android Auto Backup automatically'}
                </Text>
              </View>
            </View>
          </View>

          {/* Local backup history */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Device Backups ({backups.length})</Text>
              <TouchableOpacity onPress={loadBackups}>
                <Ionicons name="refresh" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />
            ) : backups.length === 0 ? (
              <View style={styles.emptyBackups}>
                <Text style={styles.emptyText}>No backups yet — tap "Backup Now" to create one</Text>
              </View>
            ) : (
              backups.map((backup) => (
                <View key={backup.filename} style={styles.backupRow}>
                  <View style={styles.backupIcon}>
                    <Ionicons name="document" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.backupInfo}>
                    <Text style={styles.backupDate}>{backup.date}</Text>
                    <Text style={styles.backupSize}>{formatBytes(backup.sizeBytes)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.restoreBtn}
                    onPress={() => handleRestoreLocal(backup)}
                  >
                    <Text style={styles.restoreBtnText}>Restore</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Privacy note */}
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={14} color={Colors.secondary} />
            <Text style={styles.privacyText}>
              All backup data is stored locally on your device. Cloud storage (iCloud/Google Drive) is only used when you manually export. TaxTrack never sends data to its own servers.
            </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, backgroundColor: Colors.surfaceElevated,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.xl },
  infoCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: 'rgba(10,132,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.2)',
  },
  infoText: { flex: 1 },
  infoTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.primary, marginBottom: 4 },
  infoDesc: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.xs, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: Typography.semibold },
  actionGrid: { flexDirection: 'row', gap: Spacing.sm },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textPrimary, textAlign: 'center' },
  actionDesc: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center' },
  scheduleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  scheduleText: { fontSize: Typography.sm, color: Colors.textSecondary, flex: 1 },
  backupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backupIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(10,132,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  backupInfo: { flex: 1 },
  backupDate: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  backupSize: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 1 },
  restoreBtn: {
    backgroundColor: 'rgba(10,132,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.3)',
  },
  restoreBtnText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.semibold },
  emptyBackups: { padding: Spacing.base, alignItems: 'center' },
  emptyText: { fontSize: Typography.xs, color: Colors.textTertiary, textAlign: 'center' },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'rgba(48,209,88,0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.2)',
  },
  privacyText: { flex: 1, fontSize: Typography.xs, color: Colors.secondary, lineHeight: 16 },
});
