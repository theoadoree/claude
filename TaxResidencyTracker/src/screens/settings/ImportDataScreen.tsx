import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAppStore } from '../../store';
import { pickAndParseCSV, parseSampleMonaeoData } from '../../services/ImportService';

export default function ImportDataScreen() {
  const navigation = useNavigation<any>();
  const { importLocationEntries } = useAppStore();
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleImportCSV = async () => {
    setIsImporting(true);
    try {
      const { entries, result } = await pickAndParseCSV();
      if (result.success && entries.length > 0) {
        await importLocationEntries(entries);
        setLastResult({ imported: entries.length, skipped: result.skipped });
        Alert.alert(
          'Import Successful',
          `Imported ${entries.length} location entries${result.skipped > 0 ? `. ${result.skipped} duplicate(s) skipped.` : ''}`
        );
      } else if (result.errors.length > 0) {
        Alert.alert('Import Error', result.errors.join('\n'));
      } else {
        Alert.alert('No Data', 'No location entries were found in the file');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadSampleData = async () => {
    setIsImporting(true);
    try {
      const entries = parseSampleMonaeoData();
      await importLocationEntries(entries);
      setLastResult({ imported: entries.length, skipped: 0 });
      Alert.alert('Sample Data Loaded', `Loaded ${entries.length} sample location entries`);
    } catch (e) {
      Alert.alert('Error', 'Failed to load sample data');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Import Location Data</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Monaeo Import */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="cloud-upload" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Import from Monaeo</Text>
            </View>

            <Text style={styles.sectionDesc}>
              Export your Monaeo location history as a CSV file and import it here.
              All existing entries will be preserved — duplicates are automatically skipped.
            </Text>

            {/* Steps */}
            <View style={styles.steps}>
              {[
                { num: '1', text: 'Open Monaeo app or web dashboard' },
                { num: '2', text: 'Go to Settings → Export Data → CSV' },
                { num: '3', text: 'Save the CSV file to your device' },
                { num: '4', text: 'Tap "Import CSV" below and select your file' },
              ].map((step) => (
                <View key={step.num} style={styles.step}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{step.num}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.importBtn}
              onPress={handleImportCSV}
              disabled={isImporting}
              activeOpacity={0.85}
            >
              <LinearGradient colors={Colors.gradientPrimary} style={styles.importBtnGradient}>
                <Ionicons name={isImporting ? 'hourglass' : 'cloud-upload'} size={18} color={Colors.white} />
                <Text style={styles.importBtnText}>
                  {isImporting ? 'Importing...' : 'Import Monaeo CSV'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Supported formats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supported CSV Formats</Text>
            <View style={styles.formatCard}>
              {[
                { label: 'Monaeo Export', columns: 'Date, Location, City, State, Country, Type' },
                { label: 'Generic', columns: 'date, jurisdiction/location/state/country, activity type' },
              ].map((fmt, i) => (
                <View key={i} style={[styles.formatRow, i > 0 && styles.formatRowBorder]}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.secondary} />
                  <View style={styles.formatText}>
                    <Text style={styles.formatName}>{fmt.label}</Text>
                    <Text style={styles.formatCols}>{fmt.columns}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Try it with sample data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Try with Sample Data</Text>
            <Text style={styles.sectionDesc}>
              Load 30 days of sample location data to explore the app's features.
            </Text>
            <TouchableOpacity
              style={styles.sampleBtn}
              onPress={handleLoadSampleData}
              disabled={isImporting}
            >
              <Ionicons name="flask" size={16} color={Colors.accent} />
              <Text style={styles.sampleBtnText}>Load Sample Data (30 days)</Text>
            </TouchableOpacity>
          </View>

          {/* Last result */}
          {lastResult && (
            <View style={styles.resultCard}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
              <View>
                <Text style={styles.resultTitle}>Last Import</Text>
                <Text style={styles.resultDesc}>
                  {lastResult.imported} entries imported, {lastResult.skipped} duplicates skipped
                </Text>
              </View>
            </View>
          )}

          {/* Privacy note */}
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={14} color={Colors.secondary} />
            <Text style={styles.privacyText}>
              All imported data is stored locally on your device. Nothing is uploaded to external servers.
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
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionIcon: {
    width: 36, height: 36,
    backgroundColor: 'rgba(10,132,255,0.15)', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  sectionDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  steps: { gap: Spacing.sm },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: Typography.xs, color: Colors.white, fontWeight: Typography.bold },
  stepText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, paddingTop: 2 },
  importBtn: { borderRadius: BorderRadius.base, overflow: 'hidden' },
  importBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: Spacing.sm,
  },
  importBtnText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.white },
  formatCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  formatRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.md },
  formatRowBorder: { borderTopWidth: 1, borderTopColor: Colors.separator },
  formatText: { flex: 1 },
  formatName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  formatCols: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2, fontFamily: 'monospace' },
  sampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,159,10,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.25)',
  },
  sampleBtnText: { fontSize: Typography.sm, color: Colors.accent, fontWeight: Typography.medium },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(48,209,88,0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.25)',
  },
  resultTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.secondary },
  resultDesc: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
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
