import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useAppStore } from '../../store';
import ProgressBar from '../../components/common/ProgressBar';
import RiskBadge from '../../components/common/RiskBadge';
import GradientCard from '../../components/common/GradientCard';

const { width } = Dimensions.get('window');

function AuditRiskGauge({ score, level }: { score: number; level: string }) {
  const color =
    score >= 75 ? Colors.riskCritical :
    score >= 50 ? Colors.riskHigh :
    score >= 25 ? Colors.riskModerate :
    Colors.riskLow;

  const segments = [
    { color: Colors.riskLow, label: 'Low' },
    { color: Colors.riskModerate, label: 'Moderate' },
    { color: Colors.riskHigh, label: 'High' },
    { color: Colors.riskCritical, label: 'Critical' },
  ];

  return (
    <GradientCard style={styles.auditCard}>
      <View style={styles.auditHeader}>
        <View>
          <Text style={styles.auditTitle}>Audit Risk Score</Text>
          <Text style={styles.auditSubtitle}>Based on your location history</Text>
        </View>
        <RiskBadge level={level as any} size="md" />
      </View>

      <View style={styles.auditGaugeRow}>
        <Text style={[styles.auditScore, { color }]}>{score}</Text>
        <Text style={styles.auditScoreMax}>/100</Text>
      </View>

      {/* Segmented bar */}
      <View style={styles.gaugeTrack}>
        {segments.map((seg, i) => (
          <View
            key={i}
            style={[
              styles.gaugeSegment,
              { backgroundColor: seg.color + (score >= (i + 1) * 25 ? 'FF' : '30') },
            ]}
          />
        ))}
        {/* Pointer */}
        <View style={[styles.gaugePointer, { left: `${Math.min(97, score)}%` as any }]} />
      </View>

      <View style={styles.gaugeLegend}>
        {segments.map((seg, i) => (
          <Text key={i} style={[styles.gaugeLegendText, { color: seg.color + '90' }]}>
            {seg.label}
          </Text>
        ))}
      </View>
    </GradientCard>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const {
    yearSummary,
    auditRisk,
    insights,
    jurisdictions,
    locationEntries,
    selectedYear,
    setSelectedYear,
    refreshComputed,
    userProfile,
  } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshComputed();
    setRefreshing(false);
  }, []);

  const currentYear = new Date().getFullYear();
  const urgentInsights = insights.filter((i) => i.priority === 'urgent' || i.priority === 'high');

  const daysTracked = yearSummary?.totalDaysTracked ?? 0;
  const totalDays = yearSummary?.totalDaysInYear ?? 365;
  const missingDays = yearSummary?.missingDays ?? 0;

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
            </Text>
            <Text style={styles.headerTitle}>Tax Dashboard</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Year selector */}
            <View style={styles.yearSelector}>
              <TouchableOpacity
                onPress={() => setSelectedYear(selectedYear - 1)}
                disabled={selectedYear <= 2015}
              >
                <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.yearText}>{selectedYear}</Text>
              <TouchableOpacity
                onPress={() => setSelectedYear(selectedYear + 1)}
                disabled={selectedYear >= currentYear}
              >
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.locationBtn}
              onPress={() => navigation.navigate('Calendar', { screen: 'AddLocation' })}
            >
              <Ionicons name="add-circle" size={28} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Days Overview Card */}
          <GradientCard
            colors={['#0F1E30', '#0A1525']}
            style={styles.overviewCard}
          >
            <Text style={styles.overviewLabel}>Days Tracked — {selectedYear}</Text>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{daysTracked}</Text>
                <Text style={styles.overviewStatLabel}>Tracked</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={[styles.overviewStatValue, missingDays > 30 && styles.warningText]}>
                  {missingDays}
                </Text>
                <Text style={styles.overviewStatLabel}>Missing</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{totalDays}</Text>
                <Text style={styles.overviewStatLabel}>Total Days</Text>
              </View>
            </View>
            <View style={styles.overviewBarContainer}>
              <ProgressBar
                progress={(daysTracked / totalDays) * 100}
                color={Colors.primary}
                height={8}
              />
              <Text style={styles.overviewBarLabel}>
                {Math.round((daysTracked / totalDays) * 100)}% of year documented
              </Text>
            </View>
          </GradientCard>

          {/* Audit Risk */}
          {auditRisk && (
            <AuditRiskGauge score={auditRisk.score} level={auditRisk.level} />
          )}

          {/* Urgent Alerts */}
          {urgentInsights.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.alertDot} />
                <Text style={styles.sectionTitle}>Action Required</Text>
              </View>
              {urgentInsights.slice(0, 3).map((insight) => (
                <TouchableOpacity
                  key={insight.id}
                  style={styles.alertCard}
                  onPress={() => navigation.navigate('Planning')}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.alertIndicator,
                      { backgroundColor: insight.priority === 'urgent' ? Colors.riskCritical : Colors.riskHigh },
                    ]}
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{insight.title}</Text>
                    <Text style={styles.alertDesc} numberOfLines={2}>{insight.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Jurisdiction Stats */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Jurisdiction Tracker</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Settings', { screen: 'ManageJurisdictions' })}>
                <Text style={styles.sectionAction}>Manage</Text>
              </TouchableOpacity>
            </View>

            {yearSummary?.jurisdictionStats.length === 0 && (
              <TouchableOpacity
                style={styles.emptyCard}
                onPress={() => navigation.navigate('Settings', { screen: 'ManageJurisdictions' })}
              >
                <Ionicons name="add-circle-outline" size={32} color={Colors.primary} />
                <Text style={styles.emptyTitle}>Add Jurisdictions</Text>
                <Text style={styles.emptyDesc}>Track days spent in states and countries</Text>
              </TouchableOpacity>
            )}

            {yearSummary?.jurisdictionStats.map((stat) => (
              <TouchableOpacity
                key={stat.jurisdiction.id}
                style={styles.jurisdictionCard}
                onPress={() =>
                  navigation.navigate('JurisdictionDetail', { jurisdictionId: stat.jurisdiction.id })
                }
                activeOpacity={0.8}
              >
                <View style={styles.jurisdictionCardHeader}>
                  <View style={styles.jurisdictionInfo}>
                    <View
                      style={[styles.jurisdictionDot, { backgroundColor: stat.jurisdiction.color }]}
                    />
                    <View>
                      <Text style={styles.jurisdictionName}>{stat.jurisdiction.name}</Text>
                      <Text style={styles.jurisdictionCountry}>{stat.jurisdiction.country}</Text>
                    </View>
                  </View>
                  <View style={styles.jurisdictionDays}>
                    <Text style={styles.jurisdictionDaysValue}>{stat.daysSpent}</Text>
                    <Text style={styles.jurisdictionDaysOf}>/{stat.daysAllowed}</Text>
                  </View>
                </View>

                <ProgressBar
                  progress={stat.percentageUsed}
                  color={stat.jurisdiction.color}
                  style={{ marginTop: Spacing.sm }}
                />

                <View style={styles.jurisdictionFooter}>
                  <RiskBadge level={stat.riskLevel} />
                  <Text style={styles.jurisdictionRemaining}>
                    {stat.daysRemaining > 0
                      ? `${stat.daysRemaining} days remaining`
                      : 'Limit exceeded'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              {[
                { icon: 'calendar', label: 'Log Today', onPress: () => navigation.navigate('Calendar', { screen: 'AddLocation' }) },
                { icon: 'airplane', label: 'Add Flight', onPress: () => navigation.navigate('Documents') },
                { icon: 'bed', label: 'Add Hotel', onPress: () => navigation.navigate('Documents') },
                { icon: 'cloud-upload', label: 'Import CSV', onPress: () => navigation.navigate('Settings', { screen: 'ImportData' }) },
              ].map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickAction}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon as any} size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  greeting: { fontSize: Typography.sm, color: Colors.textTertiary },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yearText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, minWidth: 36, textAlign: 'center' },
  locationBtn: { padding: 2 },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xl },

  // Overview card
  overviewCard: { gap: Spacing.md },
  overviewLabel: { fontSize: Typography.xs, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
  overviewStats: { flexDirection: 'row', justifyContent: 'space-around' },
  overviewStat: { alignItems: 'center', flex: 1 },
  overviewStatValue: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.textPrimary },
  overviewStatLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  overviewDivider: { width: 1, backgroundColor: Colors.separator, alignSelf: 'stretch' },
  overviewBarContainer: { gap: 6 },
  overviewBarLabel: { fontSize: Typography.xs, color: Colors.textTertiary, textAlign: 'right' },
  warningText: { color: Colors.riskModerate },

  // Audit gauge
  auditCard: { gap: Spacing.md },
  auditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  auditTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  auditSubtitle: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  auditGaugeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  auditScore: { fontSize: Typography['4xl'], fontWeight: Typography.bold },
  auditScoreMax: { fontSize: Typography.lg, color: Colors.textTertiary },
  gaugeTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'visible',
    gap: 2,
    position: 'relative',
  },
  gaugeSegment: { flex: 1, borderRadius: 3 },
  gaugePointer: {
    position: 'absolute',
    top: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.background,
    marginLeft: -8,
    ...Shadows.sm,
  },
  gaugeLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  gaugeLegendText: { fontSize: Typography.xs },

  // Section
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  sectionAction: { fontSize: Typography.sm, color: Colors.primary },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.riskHigh,
  },

  // Alert card
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.md,
  },
  alertIndicator: { width: 4, alignSelf: 'stretch' },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: 2 },
  alertDesc: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 16 },

  // Jurisdiction cards
  jurisdictionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  jurisdictionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jurisdictionInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  jurisdictionDot: { width: 12, height: 12, borderRadius: 6 },
  jurisdictionName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  jurisdictionCountry: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 1 },
  jurisdictionDays: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  jurisdictionDaysValue: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary },
  jurisdictionDaysOf: { fontSize: Typography.sm, color: Colors.textTertiary },
  jurisdictionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jurisdictionRemaining: { fontSize: Typography.xs, color: Colors.textTertiary },

  // Empty
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  emptyDesc: { fontSize: Typography.sm, color: Colors.textTertiary, textAlign: 'center' },

  // Quick actions
  quickActions: { flexDirection: 'row', gap: Spacing.sm },
  quickAction: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(10,132,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.2)',
  },
  quickActionLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center' },
});
