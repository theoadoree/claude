import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAppStore } from '../../store';
import GradientCard from '../../components/common/GradientCard';

export default function DayDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { date } = route.params;

  const { locationEntries, jurisdictions, documents, removeLocationEntry } = useAppStore();
  const entry = locationEntries.find((e) => e.date === date);
  const jurisdiction = entry && jurisdictions.find(
    (j) => j.id === entry.jurisdictionId ||
      j.state?.toLowerCase() === entry.state?.toLowerCase()
  );
  const relatedDocs = documents.filter((d) => d.date === date);

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Remove this location entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (entry) await removeLocationEntry(entry.id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!entry) {
    return (
      <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No entry for {format(parseISO(date), 'MMMM d, yyyy')}</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.replace('AddLocation', { date })}
            >
              <Text style={styles.addBtnText}>Add Entry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const color = jurisdiction?.color || Colors.primary;

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Day Detail</Text>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={Colors.riskHigh} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Date banner */}
          <LinearGradient colors={[color + '30', color + '10']} style={styles.dateBanner}>
            <Text style={[styles.dateDay, { color }]}>{format(parseISO(date), 'd')}</Text>
            <View>
              <Text style={styles.dateDayName}>{format(parseISO(date), 'EEEE')}</Text>
              <Text style={styles.dateMonth}>{format(parseISO(date), 'MMMM yyyy')}</Text>
            </View>
            {entry.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.secondary} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </LinearGradient>

          {/* Location info */}
          <GradientCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color={color} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {[entry.city, entry.state, entry.country].filter(Boolean).join(', ') || 'Unknown'}
                </Text>
              </View>
            </View>

            {jurisdiction && (
              <View style={styles.infoRow}>
                <View style={[styles.jurisdictionDot, { backgroundColor: color }]} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Jurisdiction</Text>
                  <Text style={[styles.infoValue, { color }]}>{jurisdiction.name}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons
                name={
                  entry.activityType === 'work' ? 'briefcase-outline' :
                  entry.activityType === 'transit' ? 'airplane-outline' :
                  'sunny-outline'
                }
                size={18}
                color={Colors.textSecondary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Activity</Text>
                <Text style={styles.infoValue}>{entry.activityType.charAt(0).toUpperCase() + entry.activityType.slice(1)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="cloud-upload-outline" size={18} color={Colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Source</Text>
                <Text style={styles.infoValue}>{entry.source.charAt(0).toUpperCase() + entry.source.slice(1)}</Text>
              </View>
            </View>

            {entry.notes && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={18} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Notes</Text>
                  <Text style={styles.infoValue}>{entry.notes}</Text>
                </View>
              </View>
            )}
          </GradientCard>

          {/* Documents */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Evidence ({relatedDocs.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Documents', { screen: 'AddDocument', params: { date } })}>
                <Text style={styles.sectionAction}>Add</Text>
              </TouchableOpacity>
            </View>
            {relatedDocs.length === 0 ? (
              <View style={styles.emptyDocs}>
                <Text style={styles.emptyDocsText}>No documents attached to this day</Text>
              </View>
            ) : (
              relatedDocs.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.docRow}
                  onPress={() => navigation.navigate('Documents', { screen: 'DocumentDetail', params: { documentId: doc.id } })}
                >
                  <Ionicons
                    name={doc.type === 'flight' ? 'airplane' : doc.type === 'hotel' ? 'bed' : 'document'}
                    size={18}
                    color={Colors.primary}
                  />
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: Spacing.xl }} />
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
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md },

  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateDay: { fontSize: Typography['4xl'], fontWeight: Typography.bold },
  dateDayName: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  dateMonth: { fontSize: Typography.sm, color: Colors.textSecondary },
  verifiedBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48,209,88,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: { fontSize: Typography.xs, color: Colors.secondary, fontWeight: Typography.semibold },

  infoCard: { gap: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  jurisdictionDot: { width: 18, height: 18, borderRadius: 9, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2 },
  infoValue: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },

  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  sectionAction: { fontSize: Typography.sm, color: Colors.primary },

  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docTitle: { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary },
  emptyDocs: { padding: Spacing.base, alignItems: 'center' },
  emptyDocsText: { fontSize: Typography.xs, color: Colors.textTertiary },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  addBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.white },
});
