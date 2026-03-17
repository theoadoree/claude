import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, JURISDICTION_COLORS } from '../../theme';

const WATCH_JURISDICTIONS = [
  { name: 'New York', state: 'NY', country: 'United States', flag: '🇺🇸', threshold: 183, note: '183-day rule' },
  { name: 'California', state: 'CA', country: 'United States', flag: '🇺🇸', threshold: 183, note: '183-day rule' },
  { name: 'New Jersey', state: 'NJ', country: 'United States', flag: '🇺🇸', threshold: 183, note: '183-day rule' },
  { name: 'Connecticut', state: 'CT', country: 'United States', flag: '🇺🇸', threshold: 183, note: '183-day rule' },
  { name: 'Massachusetts', state: 'MA', country: 'United States', flag: '🇺🇸', threshold: 183, note: '183-day rule' },
  { name: 'Illinois', state: 'IL', country: 'United States', flag: '🇺🇸', threshold: 183, note: '183-day rule' },
  { name: 'Pennsylvania', state: 'PA', country: 'United States', flag: '🇺🇸', threshold: 183, note: '183-day rule' },
  { name: 'Florida', state: 'FL', country: 'United States', flag: '🇺🇸', threshold: 366, note: 'No income tax' },
  { name: 'Texas', state: 'TX', country: 'United States', flag: '🇺🇸', threshold: 366, note: 'No income tax' },
  { name: 'Nevada', state: 'NV', country: 'United States', flag: '🇺🇸', threshold: 366, note: 'No income tax' },
  { name: 'Puerto Rico', state: 'PR', country: 'United States', flag: '🇵🇷', threshold: 183, note: 'Act 60 benefits' },
  { name: 'United Kingdom', state: undefined, country: 'United Kingdom', flag: '🇬🇧', threshold: 183, note: 'SRT 183 days' },
  { name: 'Switzerland', state: undefined, country: 'Switzerland', flag: '🇨🇭', threshold: 183, note: 'Lump-sum option' },
  { name: 'UAE', state: undefined, country: 'United Arab Emirates', flag: '🇦🇪', threshold: 183, note: 'Zero income tax' },
  { name: 'Singapore', state: undefined, country: 'Singapore', flag: '🇸🇬', threshold: 183, note: 'Low flat tax' },
  { name: 'Bermuda', state: undefined, country: 'Bermuda', flag: '🇧🇲', threshold: 183, note: 'No income tax' },
];

export default function JurisdictionSetupScreen({ navigation, route }: any) {
  const primaryJurisdiction = route.params?.primaryJurisdiction;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleContinue = () => {
    navigation.navigate('TrackingPermissions', {
      primaryJurisdiction,
      watchedJurisdictions: WATCH_JURISDICTIONS.filter((j) => selected.has(j.name)),
    });
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
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.step}>Step 2 of 3</Text>
            <Text style={styles.title}>Which jurisdictions{'\n'}should we watch?</Text>
            <Text style={styles.subtitle}>
              Select states, countries, or territories where you spend time or have tax concerns.
              You can always add more later.
            </Text>

            {primaryJurisdiction && (
              <View style={styles.primaryBadge}>
                <Ionicons name="home" size={14} color={Colors.primary} />
                <Text style={styles.primaryBadgeText}>
                  Primary: {primaryJurisdiction.name}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.selectedCount}>
            <Text style={styles.selectedCountText}>
              {selected.size} jurisdiction{selected.size !== 1 ? 's' : ''} selected
            </Text>
          </View>

          <View style={styles.list}>
            {WATCH_JURISDICTIONS.map((j, idx) => {
              const isSelected = selected.has(j.name);
              const isPrimary = primaryJurisdiction?.name === j.name;
              return (
                <TouchableOpacity
                  key={j.name}
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => !isPrimary && toggle(j.name)}
                  activeOpacity={isPrimary ? 1 : 0.7}
                >
                  <Text style={styles.flag}>{j.flag}</Text>
                  <View style={styles.itemText}>
                    <View style={styles.itemNameRow}>
                      <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                        {j.name}
                      </Text>
                      {isPrimary && (
                        <View style={styles.primaryTag}>
                          <Text style={styles.primaryTagText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemNote}>{j.note} • {j.threshold < 366 ? `${j.threshold}-day limit` : 'No day limit'}</Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                      isPrimary && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                    ]}
                  >
                    {(isSelected || isPrimary) && (
                      <Ionicons name="checkmark" size={12} color={Colors.white} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <LinearGradient colors={Colors.gradientPrimary} style={styles.continueBtnGradient}>
              <Text style={styles.continueBtnText}>
                {selected.size > 0 ? `Track ${selected.size + 1} Jurisdictions` : 'Skip for now'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </LinearGradient>
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
  scroll: { flex: 1 },
  titleSection: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.base },
  step: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,132,255,0.12)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.3)',
  },
  primaryBadgeText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.semibold },
  selectedCount: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.md },
  selectedCountText: { fontSize: Typography.xs, color: Colors.textTertiary },
  list: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(10,132,255,0.06)',
  },
  flag: { fontSize: 22 },
  itemText: { flex: 1 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  itemName: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  itemNameSelected: { color: Colors.primary },
  itemNote: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  primaryTag: {
    backgroundColor: 'rgba(10,132,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryTagText: { fontSize: 9, color: Colors.primary, fontWeight: Typography.semibold, textTransform: 'uppercase' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing['2xl'],
    backgroundColor: 'rgba(12,12,14,0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  continueBtn: { borderRadius: BorderRadius.base, overflow: 'hidden' },
  continueBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  continueBtnText: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.white },
});
