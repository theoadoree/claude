import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const COMMON_JURISDICTIONS = [
  { name: 'New York', state: 'NY', country: 'United States', flag: '🇺🇸' },
  { name: 'California', state: 'CA', country: 'United States', flag: '🇺🇸' },
  { name: 'Florida', state: 'FL', country: 'United States', flag: '🇺🇸' },
  { name: 'Texas', state: 'TX', country: 'United States', flag: '🇺🇸' },
  { name: 'New Jersey', state: 'NJ', country: 'United States', flag: '🇺🇸' },
  { name: 'Connecticut', state: 'CT', country: 'United States', flag: '🇺🇸' },
  { name: 'Massachusetts', state: 'MA', country: 'United States', flag: '🇺🇸' },
  { name: 'Illinois', state: 'IL', country: 'United States', flag: '🇺🇸' },
  { name: 'Pennsylvania', state: 'PA', country: 'United States', flag: '🇺🇸' },
  { name: 'Nevada', state: 'NV', country: 'United States', flag: '🇺🇸' },
  { name: 'Washington', state: 'WA', country: 'United States', flag: '🇺🇸' },
  { name: 'Colorado', state: 'CO', country: 'United States', flag: '🇺🇸' },
  { name: 'Puerto Rico', state: 'PR', country: 'United States', flag: '🇵🇷' },
  { name: 'United Kingdom', state: undefined, country: 'United Kingdom', flag: '🇬🇧' },
  { name: 'France', state: undefined, country: 'France', flag: '🇫🇷' },
  { name: 'Germany', state: undefined, country: 'Germany', flag: '🇩🇪' },
  { name: 'Switzerland', state: undefined, country: 'Switzerland', flag: '🇨🇭' },
  { name: 'UAE / Dubai', state: undefined, country: 'United Arab Emirates', flag: '🇦🇪' },
  { name: 'Singapore', state: undefined, country: 'Singapore', flag: '🇸🇬' },
  { name: 'Bermuda', state: undefined, country: 'Bermuda', flag: '🇧🇲' },
  { name: 'Cayman Islands', state: undefined, country: 'Cayman Islands', flag: '🇰🇾' },
  { name: 'Monaco', state: undefined, country: 'Monaco', flag: '🇲🇨' },
];

interface SelectedJurisdiction {
  name: string;
  state?: string;
  country: string;
  flag: string;
}

export default function ResidencySetupScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedJurisdiction | null>(null);

  const filtered = COMMON_JURISDICTIONS.filter(
    (j) =>
      j.name.toLowerCase().includes(search.toLowerCase()) ||
      j.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (!selected) return;
    navigation.navigate('JurisdictionSetup', { primaryJurisdiction: selected });
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
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.step}>Step 1 of 3</Text>
            <Text style={styles.title}>Where do you{'\n'}currently live?</Text>
            <Text style={styles.subtitle}>
              Select your primary tax domicile — the state or country where you are legally domiciled.
            </Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search states & countries..."
              placeholderTextColor={Colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <View style={styles.list}>
            {filtered.map((j) => {
              const isSelected = selected?.name === j.name;
              return (
                <TouchableOpacity
                  key={j.name}
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => setSelected(j)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flag}>{j.flag}</Text>
                  <View style={styles.itemText}>
                    <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                      {j.name}
                    </Text>
                    <Text style={styles.itemCountry}>{j.country}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark" size={14} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!selected}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={selected ? Colors.gradientPrimary : ['#333', '#333']}
              style={styles.continueBtnGradient}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
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
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgroundTertiary,
  },
  progressDotActive: { backgroundColor: Colors.primary },
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: Colors.backgroundTertiary,
  },
  scroll: { flex: 1 },
  titleSection: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    padding: 0,
  },
  list: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
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
    backgroundColor: 'rgba(10,132,255,0.08)',
  },
  flag: { fontSize: 24 },
  itemText: { flex: 1 },
  itemName: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  itemNameSelected: { color: Colors.primary },
  itemCountry: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
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
  continueBtn: {
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  continueBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.white,
  },
});
