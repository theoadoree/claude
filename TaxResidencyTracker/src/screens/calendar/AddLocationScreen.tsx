import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAppStore } from '../../store';
import { locationService } from '../../services/LocationService';

const ACTIVITY_TYPES = [
  { value: 'work', label: 'Work', icon: 'briefcase' },
  { value: 'personal', label: 'Personal', icon: 'sunny' },
  { value: 'transit', label: 'Transit', icon: 'airplane' },
  { value: 'unknown', label: 'Unknown', icon: 'help-circle' },
];

export default function AddLocationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { date: initialDate } = route.params || {};

  const { jurisdictions, addLocationEntry } = useAppStore();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialDate || today);
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState<string | undefined>();
  const [city, setCity] = useState('');
  const [activityType, setActivityType] = useState<'work' | 'personal' | 'transit' | 'unknown'>('personal');
  const [notes, setNotes] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedJurisdiction = jurisdictions.find((j) => j.id === selectedJurisdictionId);

  const autoDetectLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        if (location.city) setCity(location.city);
        // Try to match to a jurisdiction
        const matched = jurisdictions.find(
          (j) =>
            (location.state && j.state?.toLowerCase() === location.state.toLowerCase()) ||
            (location.state && j.name.toLowerCase() === location.state.toLowerCase())
        );
        if (matched) setSelectedJurisdictionId(matched.id);
        Alert.alert(
          'Location Detected',
          `${location.city || ''} ${location.state || ''} ${location.country || ''}`.trim()
        );
      } else {
        Alert.alert('Location Error', 'Could not detect location. Please select manually.');
      }
    } catch (e) {
      Alert.alert('Error', 'Location detection failed');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!selectedJurisdictionId && !city) {
      Alert.alert('Required', 'Please select a jurisdiction or enter a city');
      return;
    }
    setIsSaving(true);
    try {
      await addLocationEntry({
        date,
        jurisdictionId: selectedJurisdictionId,
        jurisdictionName: selectedJurisdiction?.name,
        city: city || undefined,
        state: selectedJurisdiction?.state,
        country: selectedJurisdiction?.country,
        activityType,
        isVerified,
        source: 'manual',
        notes: notes || undefined,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save location entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Location</Text>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date</Text>
            <View style={styles.dateDisplay}>
              <Ionicons name="calendar" size={16} color={Colors.primary} />
              <Text style={styles.dateText}>
                {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>
          </View>

          {/* Auto-detect */}
          <TouchableOpacity
            style={styles.autoDetectBtn}
            onPress={autoDetectLocation}
            disabled={isLoadingLocation}
          >
            <Ionicons
              name={isLoadingLocation ? 'hourglass' : 'locate'}
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.autoDetectText}>
              {isLoadingLocation ? 'Detecting location...' : 'Auto-detect current location'}
            </Text>
          </TouchableOpacity>

          {/* Jurisdiction */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Jurisdiction</Text>
            <View style={styles.jurisdictionList}>
              {jurisdictions.map((j) => (
                <TouchableOpacity
                  key={j.id}
                  style={[
                    styles.jurisdictionOption,
                    selectedJurisdictionId === j.id && styles.jurisdictionOptionSelected,
                    selectedJurisdictionId === j.id && { borderColor: j.color },
                  ]}
                  onPress={() =>
                    setSelectedJurisdictionId(selectedJurisdictionId === j.id ? undefined : j.id)
                  }
                >
                  <View style={[styles.jurisdictionDot, { backgroundColor: j.color }]} />
                  <Text
                    style={[
                      styles.jurisdictionOptionText,
                      selectedJurisdictionId === j.id && { color: j.color },
                    ]}
                  >
                    {j.name}
                  </Text>
                  {selectedJurisdictionId === j.id && (
                    <Ionicons name="checkmark-circle" size={16} color={j.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* City */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>City (optional)</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. New York City"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          {/* Activity Type */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Activity Type</Text>
            <View style={styles.activityRow}>
              {ACTIVITY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.activityOption,
                    activityType === type.value && styles.activityOptionSelected,
                  ]}
                  onPress={() => setActivityType(type.value as any)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={18}
                    color={activityType === type.value ? Colors.primary : Colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.activityLabel,
                      activityType === type.value && styles.activityLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Verified */}
          <View style={[styles.field, styles.switchField]}>
            <View>
              <Text style={styles.fieldLabel}>Mark as Verified</Text>
              <Text style={styles.fieldHint}>I have supporting documents for this day</Text>
            </View>
            <Switch
              value={isVerified}
              onValueChange={setIsVerified}
              trackColor={{ false: Colors.backgroundTertiary, true: Colors.primary + '50' }}
              thumbColor={isVerified ? Colors.primary : Colors.textTertiary}
            />
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Business meeting, client visit..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
            />
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
    width: 36,
    height: 36,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  fieldHint: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateText: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium },
  autoDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(10,132,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.25)',
  },
  autoDetectText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
  jurisdictionList: { gap: Spacing.sm },
  jurisdictionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jurisdictionOptionSelected: { backgroundColor: 'rgba(10,132,255,0.06)' },
  jurisdictionDot: { width: 8, height: 8, borderRadius: 4 },
  jurisdictionOptionText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  activityRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  activityOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  activityOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(10,132,255,0.08)',
  },
  activityLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  activityLabelSelected: { color: Colors.primary, fontWeight: Typography.semibold },
  switchField: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
