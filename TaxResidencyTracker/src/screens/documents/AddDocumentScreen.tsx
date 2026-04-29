import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAppStore } from '../../store';
import { DocumentType } from '../../types';

export default function AddDocumentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { type: initialType = 'other', date: initialDate } = route.params || {};

  const today = new Date().toISOString().split('T')[0];
  const { addDocument, jurisdictions } = useAppStore();

  const [type, setType] = useState<DocumentType>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(initialDate || today);
  const [isSaving, setIsSaving] = useState(false);

  // Flight fields
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');

  // Hotel fields
  const [hotel, setHotel] = useState('');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(today);
  const [city, setCity] = useState('');

  const handleSave = async () => {
    const docTitle = title ||
      (type === 'flight' && origin && destination ? `${origin} → ${destination}` : '') ||
      (type === 'hotel' && hotel ? hotel : '') ||
      `${type.charAt(0).toUpperCase() + type.slice(1)} ${format(parseISO(date), 'MMM d, yyyy')}`;

    if (!docTitle) {
      Alert.alert('Required', 'Please add a title or fill in the details');
      return;
    }

    setIsSaving(true);
    try {
      await addDocument({
        type,
        title: docTitle,
        description: description || undefined,
        uri: '',
        date,
        tags: [],
        extractedData: type === 'flight' ? {
          origin: origin || undefined,
          destination: destination || undefined,
          airline: airline || undefined,
          flightNumber: flightNumber || undefined,
        } : type === 'hotel' ? {
          hotel: hotel || undefined,
          checkIn: checkIn || undefined,
          checkOut: checkOut || undefined,
        } : undefined,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const TYPE_OPTIONS: { value: DocumentType; label: string; icon: string }[] = [
    { value: 'flight', label: 'Flight', icon: 'airplane' },
    { value: 'hotel', label: 'Hotel', icon: 'bed' },
    { value: 'receipt', label: 'Receipt', icon: 'receipt' },
    { value: 'photo', label: 'Photo', icon: 'camera' },
    { value: 'other', label: 'Other', icon: 'document' },
  ];

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Document</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
            <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Type selector */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Document Type</Text>
            <View style={styles.typeRow}>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.typeOption, type === opt.value && styles.typeOptionSelected]}
                  onPress={() => setType(opt.value)}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={18}
                    color={type === opt.value ? Colors.primary : Colors.textTertiary}
                  />
                  <Text style={[styles.typeLabel, type === opt.value && styles.typeLabelSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Flight specific */}
          {type === 'flight' && (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Route</Text>
                <View style={styles.routeRow}>
                  <TextInput
                    style={[styles.input, styles.routeInput]}
                    value={origin}
                    onChangeText={setOrigin}
                    placeholder="From (e.g. JFK)"
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="characters"
                  />
                  <Ionicons name="arrow-forward" size={16} color={Colors.textTertiary} />
                  <TextInput
                    style={[styles.input, styles.routeInput]}
                    value={destination}
                    onChangeText={setDestination}
                    placeholder="To (e.g. MIA)"
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              <View style={styles.rowFields}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Airline</Text>
                  <TextInput
                    style={styles.input}
                    value={airline}
                    onChangeText={setAirline}
                    placeholder="e.g. Delta"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Flight #</Text>
                  <TextInput
                    style={styles.input}
                    value={flightNumber}
                    onChangeText={setFlightNumber}
                    placeholder="e.g. DL123"
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </>
          )}

          {/* Hotel specific */}
          {type === 'hotel' && (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Hotel Name</Text>
                <TextInput
                  style={styles.input}
                  value={hotel}
                  onChangeText={setHotel}
                  placeholder="e.g. Four Seasons New York"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. New York City"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={styles.rowFields}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Check-in</Text>
                  <TextInput
                    style={styles.input}
                    value={checkIn}
                    onChangeText={setCheckIn}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Check-out</Text>
                  <TextInput
                    style={styles.input}
                    value={checkOut}
                    onChangeText={setCheckOut}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
              </View>
            </>
          )}

          {/* Common fields */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title (optional)</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Leave blank to auto-generate"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Any additional notes..."
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
  typeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  typeOption: {
    flex: 1,
    minWidth: '28%',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeOptionSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(10,132,255,0.08)' },
  typeLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  typeLabelSelected: { color: Colors.primary, fontWeight: Typography.semibold },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  routeInput: { flex: 1 },
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
  notesInput: { height: 80, textAlignVertical: 'top' },
});
