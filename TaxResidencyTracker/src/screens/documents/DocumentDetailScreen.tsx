import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAppStore } from '../../store';
import GradientCard from '../../components/common/GradientCard';

export default function DocumentDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { documentId } = route.params;
  const { documents, removeDocument } = useAppStore();
  const doc = documents.find((d) => d.id === documentId);

  if (!doc) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.backBtn}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>Document not found</Text>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Document', `Remove "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeDocument(doc.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const typeIcon =
    doc.type === 'flight' ? 'airplane' :
    doc.type === 'hotel' ? 'bed' :
    doc.type === 'photo' ? 'camera' :
    doc.type === 'receipt' ? 'receipt' :
    doc.type === 'screenshot' ? 'phone-portrait' : 'document';

  const typeColor =
    doc.type === 'flight' ? Colors.primary :
    doc.type === 'hotel' ? Colors.accent :
    doc.type === 'photo' ? '#BF5AF2' :
    doc.type === 'receipt' ? Colors.secondary : Colors.textSecondary;

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document</Text>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={Colors.riskHigh} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Type banner */}
          <LinearGradient colors={[typeColor + '30', typeColor + '10']} style={styles.typeBanner}>
            <View style={[styles.typeIconContainer, { backgroundColor: typeColor + '25' }]}>
              <Ionicons name={typeIcon as any} size={28} color={typeColor} />
            </View>
            <View>
              <Text style={[styles.docType, { color: typeColor }]}>
                {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
              </Text>
              <Text style={styles.docTitle}>{doc.title}</Text>
            </View>
          </LinearGradient>

          {/* Preview image if available */}
          {doc.uri && (doc.type === 'photo' || doc.type === 'screenshot') && (
            <Image source={{ uri: doc.uri }} style={styles.preview} resizeMode="cover" />
          )}

          {/* Details */}
          <GradientCard style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textTertiary} />
              <View>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{format(parseISO(doc.date), 'EEEE, MMMM d, yyyy')}</Text>
              </View>
            </View>

            {doc.description && (
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={16} color={Colors.textTertiary} />
                <View>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{doc.description}</Text>
                </View>
              </View>
            )}

            {/* Flight data */}
            {doc.type === 'flight' && doc.extractedData && (
              <>
                {doc.extractedData.origin && (
                  <View style={styles.detailRow}>
                    <Ionicons name="airplane-outline" size={16} color={Colors.primary} />
                    <View>
                      <Text style={styles.detailLabel}>Route</Text>
                      <Text style={styles.detailValue}>
                        {doc.extractedData.origin} → {doc.extractedData.destination}
                      </Text>
                    </View>
                  </View>
                )}
                {doc.extractedData.airline && (
                  <View style={styles.detailRow}>
                    <Ionicons name="business-outline" size={16} color={Colors.textTertiary} />
                    <View>
                      <Text style={styles.detailLabel}>Airline & Flight</Text>
                      <Text style={styles.detailValue}>
                        {doc.extractedData.airline} {doc.extractedData.flightNumber || ''}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Hotel data */}
            {doc.type === 'hotel' && doc.extractedData && (
              <>
                {doc.extractedData.hotel && (
                  <View style={styles.detailRow}>
                    <Ionicons name="bed-outline" size={16} color={Colors.accent} />
                    <View>
                      <Text style={styles.detailLabel}>Hotel</Text>
                      <Text style={styles.detailValue}>{doc.extractedData.hotel}</Text>
                    </View>
                  </View>
                )}
                {doc.extractedData.checkIn && (
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.textTertiary} />
                    <View>
                      <Text style={styles.detailLabel}>Stay</Text>
                      <Text style={styles.detailValue}>
                        {format(parseISO(doc.extractedData.checkIn), 'MMM d')}
                        {doc.extractedData.checkOut && ` → ${format(parseISO(doc.extractedData.checkOut), 'MMM d, yyyy')}`}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={Colors.textTertiary} />
              <View>
                <Text style={styles.detailLabel}>Added</Text>
                <Text style={styles.detailValue}>{format(parseISO(doc.createdAt), 'MMM d, yyyy HH:mm')}</Text>
              </View>
            </View>
          </GradientCard>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeIconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  docType: { fontSize: Typography.xs, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  docTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginTop: 2 },
  preview: { width: '100%', height: 200, borderRadius: BorderRadius.lg },
  detailsCard: { gap: Spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  detailLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2 },
  detailValue: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium },
  errorText: { color: Colors.textSecondary, padding: Spacing.xl },
});
