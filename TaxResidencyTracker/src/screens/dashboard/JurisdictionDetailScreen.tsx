import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAppStore } from '../../store';
import ProgressBar from '../../components/common/ProgressBar';
import RiskBadge from '../../components/common/RiskBadge';
import GradientCard from '../../components/common/GradientCard';
import { format, parseISO } from 'date-fns';

export default function JurisdictionDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { jurisdictionId } = route.params;

  const { yearSummary, locationEntries, selectedYear } = useAppStore();
  const stat = yearSummary?.jurisdictionStats.find((s) => s.jurisdiction.id === jurisdictionId);

  if (!stat) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: Colors.textPrimary, padding: 20 }}>Jurisdiction not found</Text>
      </SafeAreaView>
    );
  }

  const { jurisdiction } = stat;

  const jurisdictionEntries = locationEntries
    .filter(
      (e) =>
        e.date.startsWith(String(selectedYear)) &&
        (e.jurisdictionId === jurisdiction.id ||
          e.state?.toLowerCase() === jurisdiction.state?.toLowerCase() ||
          e.jurisdictionName?.toLowerCase().includes(jurisdiction.name.toLowerCase()))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  // Group by month
  const byMonth: Record<string, typeof jurisdictionEntries> = {};
  jurisdictionEntries.forEach((e) => {
    const month = e.date.substring(0, 7);
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(e);
  });

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.colorDot, { backgroundColor: jurisdiction.color }]} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{jurisdiction.name}</Text>
            <Text style={styles.headerSub}>{jurisdiction.country}</Text>
          </View>
          <RiskBadge level={stat.riskLevel} size="sm" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Days Spent', value: stat.daysSpent.toString(), color: jurisdiction.color },
              { label: 'Days Allowed', value: stat.daysAllowed.toString(), color: Colors.textSecondary },
              { label: 'Days Left', value: stat.daysRemaining.toString(), color: stat.daysRemaining < 30 ? Colors.riskHigh : Colors.secondary },
              { label: 'Used', value: `${Math.round(stat.percentageUsed)}%`, color: jurisdiction.color },
            ].map((item, i) => (
              <GradientCard key={i} style={styles.statCard} padding={Spacing.md}>
                <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </GradientCard>
            ))}
          </View>

          {/* Progress */}
          <GradientCard style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Day Count Progress</Text>
              <Text style={styles.progressPct}>{Math.round(stat.percentageUsed)}%</Text>
            </View>
            <ProgressBar progress={stat.percentageUsed} color={jurisdiction.color} height={10} />
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>0 days</Text>
              <Text style={styles.progressLabel}>{stat.daysAllowed} days (limit)</Text>
            </View>

            {stat.daysRemaining <= 30 && stat.daysRemaining > 0 && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={14} color={Colors.riskHigh} />
                <Text style={styles.warningText}>
                  Only {stat.daysRemaining} days remaining before triggering residency obligations
                </Text>
              </View>
            )}

            {stat.daysRemaining === 0 && (
              <View style={[styles.warningBanner, styles.criticalBanner]}>
                <Ionicons name="alert-circle" size={14} color={Colors.riskCritical} />
                <Text style={[styles.warningText, { color: Colors.riskCritical }]}>
                  Day limit exceeded — consult a tax advisor
                </Text>
              </View>
            )}
          </GradientCard>

          {/* Tax Rule Info */}
          {jurisdiction.taxRule && (
            <GradientCard style={styles.ruleCard}>
              <View style={styles.ruleHeader}>
                <Ionicons name="document-text" size={16} color={Colors.primary} />
                <Text style={styles.ruleTitle}>Tax Rule</Text>
              </View>
              <Text style={styles.ruleDesc}>{jurisdiction.taxRule.description}</Text>
            </GradientCard>
          )}

          {/* Monthly Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Monthly Breakdown — {stat.daysSpent} days in {selectedYear}
            </Text>

            {Object.keys(byMonth).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No days logged in {jurisdiction.name} yet</Text>
              </View>
            ) : (
              Object.entries(byMonth)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([month, entries]) => (
                  <GradientCard key={month} style={styles.monthCard} padding={Spacing.md}>
                    <View style={styles.monthHeader}>
                      <Text style={styles.monthName}>
                        {format(parseISO(month + '-01'), 'MMMM')}
                      </Text>
                      <View style={styles.monthBadge}>
                        <Text style={styles.monthBadgeText}>{entries.length} days</Text>
                      </View>
                    </View>
                    <View style={styles.monthDays}>
                      {entries.map((e) => (
                        <View key={e.id} style={styles.dayChip}>
                          <Text style={styles.dayChipText}>
                            {format(parseISO(e.date), 'd')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </GradientCard>
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
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  headerSub: { fontSize: Typography.xs, color: Colors.textTertiary },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center' },
  statValue: { fontSize: Typography['2xl'], fontWeight: Typography.bold },
  statLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },

  progressCard: { gap: Spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  progressPct: { fontSize: Typography.sm, color: Colors.textSecondary },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: Typography.xs, color: Colors.textTertiary },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.3)',
  },
  criticalBanner: {
    backgroundColor: 'rgba(255,45,85,0.12)',
    borderColor: 'rgba(255,45,85,0.3)',
  },
  warningText: { flex: 1, fontSize: Typography.xs, color: Colors.riskHigh, lineHeight: 16 },

  ruleCard: { gap: Spacing.sm },
  ruleHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ruleTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  ruleDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },

  section: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },

  monthCard: { gap: Spacing.md },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  monthBadge: {
    backgroundColor: Colors.primaryDark + '30',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  monthBadgeText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.semibold },
  monthDays: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dayChip: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryDark + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  dayChipText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.medium },

  emptyState: { alignItems: 'center', padding: Spacing['2xl'] },
  emptyText: { fontSize: Typography.sm, color: Colors.textTertiary },
});
