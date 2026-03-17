import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, JURISDICTION_COLORS } from '../../theme';
import { useAppStore } from '../../store';

const COMMON_JURISDICTIONS = [
  { name: 'New York', state: 'NY', country: 'United States', threshold: 183 },
  { name: 'California', state: 'CA', country: 'United States', threshold: 183 },
  { name: 'Florida', state: 'FL', country: 'United States', threshold: 366 },
  { name: 'Texas', state: 'TX', country: 'United States', threshold: 366 },
  { name: 'New Jersey', state: 'NJ', country: 'United States', threshold: 183 },
  { name: 'Connecticut', state: 'CT', country: 'United States', threshold: 183 },
  { name: 'Massachusetts', state: 'MA', country: 'United States', threshold: 183 },
  { name: 'Illinois', state: 'IL', country: 'United States', threshold: 183 },
  { name: 'Nevada', state: 'NV', country: 'United States', threshold: 366 },
  { name: 'Puerto Rico', state: 'PR', country: 'United States', threshold: 183 },
  { name: 'United Kingdom', state: undefined, country: 'United Kingdom', threshold: 183 },
  { name: 'UAE', state: undefined, country: 'United Arab Emirates', threshold: 183 },
  { name: 'Singapore', state: undefined, country: 'Singapore', threshold: 183 },
  { name: 'Bermuda', state: undefined, country: 'Bermuda', threshold: 183 },
];

export default function JurisdictionEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { jurisdictionId } = route.params || {};
  const { jurisdictions, addJurisdiction, updateJurisdiction } = useAppStore();

  const existing = jurisdictions.find((j) => j.id === jurisdictionId);

  const [name, setName] = useState(existing?.name || '');
  const [state, setState] = useState(existing?.state || '');
  const [country, setCountry] = useState(existing?.country || 'United States');
  const [threshold, setThreshold] = useState(String(existing?.taxRule?.residencyDayThreshold || 183));
  const [selectedColor, setSelectedColor] = useState(existing?.color || JURISDICTION_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const fillFromPreset = (preset: typeof COMMON_JURISDICTIONS[0]) => {
    setName(preset.name);
    setState(preset.state || '');
    setCountry(preset.country);
    setThreshold(String(preset.threshold));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a jurisdiction name');
      return;
    }
    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        state: state.trim() || undefined,
        country: country.trim() || 'United States',
        color: selectedColor,
        type: state ? 'state' as const : 'country' as const,
        isPrimary: existing?.isPrimary ?? false,
        isTracked: true,
        taxRule: {
          jurisdictionId: existing?.id || '',
          residencyDayThreshold: parseInt(threshold) || 183,
          safeHarborDays: parseInt(threshold) || 183,
          ruleType: 'days_test' as const,
          description: `${name}: ${threshold}-day rule`,
        },
      };

      if (existing) {
        await updateJurisdiction(existing.id, data);
      } else {
        await addJurisdiction(data);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save jurisdiction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{existing ? 'Edit' : 'Add'} Jurisdiction</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
            <Text style={styles.saveBtnText}>{isSaving ? '...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Quick presets */}
          {!existing && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Quick Select</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.presetRow}>
                  {COMMON_JURISDICTIONS.map((p) => (
                    <TouchableOpacity key={p.name} style={styles.presetChip} onPress={() => fillFromPreset(p)}>
                      <Text style={styles.presetText}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. New York"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.rowFields}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>State/Region</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="e.g. NY"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="characters"
              />
            </View>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={styles.fieldLabel}>Country</Text>
              <TextInput
                style={styles.input}
                value={country}
                onChangeText={setCountry}
                placeholder="e.g. United States"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Day Limit (triggers residency)</Text>
            <TextInput
              style={styles.input}
              value={threshold}
              onChangeText={setThreshold}
              keyboardType="number-pad"
              placeholder="183"
              placeholderTextColor={Colors.textTertiary}
            />
            <Text style={styles.fieldHint}>
              Most US states use 183 days. No-tax states like FL, TX, NV have no limit.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {JURISDICTION_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSwatchSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={14} color={Colors.white} />
                  )}
                </TouchableOpacity>
              ))}
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
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  saveBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.white },
  scroll: { flex: 1, paddingHorizontal: Spacing.base },
  field: { marginBottom: Spacing.lg, gap: Spacing.sm },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  fieldHint: { fontSize: Typography.xs, color: Colors.textTertiary, lineHeight: 16 },
  rowFields: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetRow: { flexDirection: 'row', gap: Spacing.sm },
  presetChip: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetText: { fontSize: Typography.xs, color: Colors.textSecondary },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: Colors.white,
  },
});
