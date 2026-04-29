import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAppStore } from '../../store';

export default function ManageJurisdictionsScreen() {
  const navigation = useNavigation<any>();
  const { jurisdictions, removeJurisdiction, yearSummary } = useAppStore();

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Jurisdiction', `Remove ${name} from tracking?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeJurisdiction(id) },
    ]);
  };

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Jurisdictions</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('JurisdictionEdit', {})}
          >
            <Ionicons name="add" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {jurisdictions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No jurisdictions</Text>
              <Text style={styles.emptyDesc}>Add states and countries to start tracking your days</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('JurisdictionEdit', {})}
              >
                <Text style={styles.emptyBtnText}>Add First Jurisdiction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            jurisdictions.map((j) => {
              const stat = yearSummary?.jurisdictionStats.find((s) => s.jurisdiction.id === j.id);
              return (
                <View key={j.id} style={styles.jurisdictionRow}>
                  <View style={[styles.colorBadge, { backgroundColor: j.color }]} />
                  <View style={styles.jurisdictionInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.jurisdictionName}>{j.name}</Text>
                      {j.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.jurisdictionCountry}>{j.country}</Text>
                    {stat && (
                      <Text style={styles.jurisdictionDays}>
                        {stat.daysSpent}/{stat.daysAllowed} days this year
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('JurisdictionEdit', { jurisdictionId: j.id })}
                    style={styles.editBtn}
                  >
                    <Ionicons name="pencil" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  {!j.isPrimary && (
                    <TouchableOpacity
                      onPress={() => handleDelete(j.id, j.name)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.riskHigh} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
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
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, backgroundColor: Colors.surfaceElevated,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  addBtn: {
    width: 36, height: 36, backgroundColor: 'rgba(10,132,255,0.15)',
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  jurisdictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorBadge: { width: 12, height: 12, borderRadius: 6 },
  jurisdictionInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  jurisdictionName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  primaryBadge: {
    backgroundColor: 'rgba(10,132,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: Typography.semibold },
  jurisdictionCountry: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 1 },
  jurisdictionDays: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  editBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(10,132,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,69,58,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.md },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  emptyDesc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  emptyBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.white },
});
