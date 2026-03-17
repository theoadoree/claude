import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useAppStore } from '../../store';
import GradientCard from '../../components/common/GradientCard';
import RiskBadge from '../../components/common/RiskBadge';
import ProgressBar from '../../components/common/ProgressBar';

const { width } = Dimensions.get('window');

const RECOMMENDED_JURISDICTIONS = [
  {
    name: 'Florida',
    country: 'United States',
    flag: '🇺🇸',
    type: 'No Income Tax',
    requiredDays: 183,
    highlight: 'Zero state income tax',
    pros: ['No state income tax', 'Favorable domicile laws', 'No estate tax', 'Warm climate'],
    cons: ['Hurricane risk', 'High property costs in cities'],
    color: Colors.riskLow,
  },
  {
    name: 'Puerto Rico (Act 60)',
    country: 'United States Territory',
    flag: '🇵🇷',
    type: 'Tax Incentive',
    requiredDays: 183,
    highlight: '0–4% on qualifying income',
    pros: ['0% capital gains tax', '4% flat corporate tax', 'US territory (no foreign reporting)', 'No self-employment tax on qualifying income'],
    cons: ['Must genuinely relocate', 'Application fees apply', 'Strong IRS audit scrutiny'],
    color: '#BF5AF2',
  },
  {
    name: 'UAE / Dubai',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    type: 'Zero Tax',
    requiredDays: 183,
    highlight: 'Zero income tax for residents',
    pros: ['No personal income tax', 'No capital gains tax', 'Strategic location', 'Strong financial hub'],
    cons: ['Requires genuine relocation', 'US persons still file FBAR/FATCA', 'Cultural adjustment'],
    color: Colors.accent,
  },
  {
    name: 'Portugal (NHR)',
    country: 'Portugal',
    flag: '🇵🇹',
    type: 'Special Regime',
    requiredDays: 183,
    highlight: '10% flat tax on foreign pension income',
    pros: ['NHR regime for new residents', 'Low cost of living', 'EU residency', 'Golden Visa program'],
    cons: ['NHR rules have changed', 'US persons still pay US taxes', 'Requires real relocation'],
    color: Colors.primary,
  },
  {
    name: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    type: 'Low Tax',
    requiredDays: 183,
    highlight: 'Max 22% income tax, no capital gains tax',
    pros: ['No capital gains tax', 'Territorial tax system', 'World-class infrastructure', 'Low crime'],
    cons: ['High cost of living', 'Strict laws', 'Limited space'],
    color: '#FF2D55',
  },
  {
    name: 'Nevada',
    country: 'United States',
    flag: '🇺🇸',
    type: 'No Income Tax',
    requiredDays: 183,
    highlight: 'No state income tax, low cost',
    pros: ['No state income tax', 'Low property taxes', 'Easy domicile establishment', 'Business-friendly'],
    cons: ['Desert climate', 'Limited public services', 'Requires genuine residency'],
    color: Colors.riskModerate,
  },
];

const PRIORITY_COLORS = {
  urgent: Colors.riskCritical,
  high: Colors.riskHigh,
  medium: Colors.riskModerate,
  low: Colors.riskLow,
};

function InsightCard({ insight }: { insight: any }) {
  const [expanded, setExpanded] = useState(false);
  const color = PRIORITY_COLORS[insight.priority as keyof typeof PRIORITY_COLORS];

  const categoryIcon =
    insight.category === 'compliance' ? 'shield' :
    insight.category === 'optimization' ? 'trending-up' :
    insight.category === 'risk' ? 'warning' : 'star';

  return (
    <TouchableOpacity
      style={[styles.insightCard, { borderLeftColor: color }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.insightHeader}>
        <View style={[styles.insightIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={categoryIcon as any} size={16} color={color} />
        </View>
        <View style={styles.insightHeaderText}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <View style={styles.insightMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.priorityText, { color }]}>
                {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
              </Text>
            </View>
            <Text style={styles.insightCategory}>{insight.category}</Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textTertiary}
        />
      </View>

      {expanded && (
        <View style={styles.insightBody}>
          <Text style={styles.insightDesc}>{insight.description}</Text>
          {insight.actionItems?.length > 0 && (
            <View style={styles.actionItems}>
              <Text style={styles.actionItemsTitle}>Action Items</Text>
              {insight.actionItems.map((item: string, i: number) => (
                <View key={i} style={styles.actionItem}>
                  <View style={[styles.actionItemDot, { backgroundColor: color }]} />
                  <Text style={styles.actionItemText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function JurisdictionRecommendationCard({ j }: { j: typeof RECOMMENDED_JURISDICTIONS[0] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.recCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.recHeader}>
        <Text style={styles.recFlag}>{j.flag}</Text>
        <View style={styles.recInfo}>
          <Text style={styles.recName}>{j.name}</Text>
          <Text style={styles.recCountry}>{j.country}</Text>
        </View>
        <View style={[styles.recTypeBadge, { backgroundColor: j.color + '20' }]}>
          <Text style={[styles.recTypeText, { color: j.color }]}>{j.type}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textTertiary}
        />
      </View>

      <View style={styles.recHighlight}>
        <Ionicons name="star" size={12} color={j.color} />
        <Text style={[styles.recHighlightText, { color: j.color }]}>{j.highlight}</Text>
      </View>

      {expanded && (
        <View style={styles.recBody}>
          <Text style={styles.recDays}>
            Requires {j.requiredDays}+ days/year in {j.name}
          </Text>

          <View style={styles.recColumns}>
            <View style={styles.recColumn}>
              <Text style={[styles.recColumnTitle, { color: Colors.riskLow }]}>Pros</Text>
              {j.pros.map((p, i) => (
                <View key={i} style={styles.recBullet}>
                  <Ionicons name="checkmark" size={12} color={Colors.riskLow} />
                  <Text style={styles.recBulletText}>{p}</Text>
                </View>
              ))}
            </View>
            <View style={styles.recColumn}>
              <Text style={[styles.recColumnTitle, { color: Colors.riskHigh }]}>Cons</Text>
              {j.cons.map((c, i) => (
                <View key={i} style={styles.recBullet}>
                  <Ionicons name="close" size={12} color={Colors.riskHigh} />
                  <Text style={styles.recBulletText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.recDisclaimer}>
            <Ionicons name="information-circle-outline" size={12} color={Colors.textTertiary} />
            <Text style={styles.recDisclaimerText}>
              Always consult a qualified international tax attorney before changing residency.
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TaxPlanningScreen() {
  const { yearSummary, auditRisk, insights, selectedYear } = useAppStore();
  const [activeTab, setActiveTab] = useState<'insights' | 'opportunities' | 'risk'>('insights');

  const tabs = [
    { key: 'insights', label: 'Insights', count: insights.length },
    { key: 'opportunities', label: 'Opportunities', count: RECOMMENDED_JURISDICTIONS.length },
    { key: 'risk', label: 'Risk Analysis', count: null },
  ];

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Tax Planning</Text>
            <Text style={styles.headerSubtitle}>{selectedYear} Analysis</Text>
          </View>
          {auditRisk && <RiskBadge level={auditRisk.level} size="lg" />}
        </View>

        {/* Quick Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
          {[
            { label: 'Risk Score', value: auditRisk?.score.toString() || '-', color: auditRisk ? (auditRisk.score >= 50 ? Colors.riskHigh : auditRisk.score >= 25 ? Colors.riskModerate : Colors.riskLow) : Colors.textTertiary },
            { label: 'Days Tracked', value: yearSummary?.totalDaysTracked.toString() || '0', color: Colors.primary },
            { label: 'Jurisdictions', value: yearSummary?.jurisdictionStats.length.toString() || '0', color: Colors.accent },
            { label: 'Missing Days', value: yearSummary?.missingDays.toString() || '0', color: (yearSummary?.missingDays || 0) > 30 ? Colors.riskModerate : Colors.secondary },
          ].map((stat, i) => (
            <View key={i} style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.quickStatLabel}>{stat.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count !== null && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* INSIGHTS TAB */}
          {activeTab === 'insights' && (
            <View style={styles.tabContent}>
              {insights.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle" size={40} color={Colors.riskLow} />
                  <Text style={styles.emptyTitle}>All Clear</Text>
                  <Text style={styles.emptyDesc}>
                    No critical tax planning issues detected. Keep logging your location to maintain accurate records.
                  </Text>
                </View>
              ) : (
                insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))
              )}
            </View>
          )}

          {/* OPPORTUNITIES TAB */}
          {activeTab === 'opportunities' && (
            <View style={styles.tabContent}>
              <View style={styles.oppHeader}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.oppHeaderText}>
                  These jurisdictions may offer tax advantages based on your profile. This is educational information only — not tax advice.
                </Text>
              </View>
              {RECOMMENDED_JURISDICTIONS.map((j, i) => (
                <JurisdictionRecommendationCard key={i} j={j} />
              ))}
            </View>
          )}

          {/* RISK TAB */}
          {activeTab === 'risk' && (
            <View style={styles.tabContent}>
              {auditRisk ? (
                <>
                  <GradientCard style={styles.riskOverview}>
                    <Text style={styles.riskOverviewTitle}>Audit Risk Overview</Text>
                    <View style={styles.riskScoreRow}>
                      <Text style={[styles.riskScoreValue, {
                        color: auditRisk.score >= 75 ? Colors.riskCritical :
                               auditRisk.score >= 50 ? Colors.riskHigh :
                               auditRisk.score >= 25 ? Colors.riskModerate : Colors.riskLow
                      }]}>
                        {auditRisk.score}
                      </Text>
                      <Text style={styles.riskScoreMax}>/100</Text>
                    </View>
                    <ProgressBar
                      progress={auditRisk.score}
                      height={12}
                    />
                    <Text style={styles.riskDesc}>
                      {auditRisk.score < 25
                        ? 'Your records are in good shape. Keep maintaining consistent documentation.'
                        : auditRisk.score < 50
                        ? 'Moderate audit exposure. Focus on improving documentation.'
                        : auditRisk.score < 75
                        ? 'High audit risk. Take action on the recommendations below.'
                        : 'Critical audit risk. Consult a tax professional immediately.'}
                    </Text>
                  </GradientCard>

                  <Text style={styles.factorsTitle}>Risk Factors</Text>
                  {auditRisk.factors.map((factor, i) => (
                    <View key={i} style={styles.factorCard}>
                      <Ionicons
                        name={factor.impact === 'positive' ? 'checkmark-circle' : factor.impact === 'negative' ? 'warning' : 'remove-circle'}
                        size={20}
                        color={factor.impact === 'positive' ? Colors.riskLow : factor.impact === 'negative' ? Colors.riskHigh : Colors.textTertiary}
                      />
                      <View style={styles.factorText}>
                        <Text style={styles.factorDesc}>{factor.description}</Text>
                        {factor.details && (
                          <Text style={styles.factorDetails}>{factor.details}</Text>
                        )}
                      </View>
                      <Text style={[
                        styles.factorImpact,
                        { color: factor.impact === 'positive' ? Colors.riskLow : factor.impact === 'negative' ? Colors.riskHigh : Colors.textTertiary }
                      ]}>
                        {factor.impact === 'positive' ? '▼ Risk' : factor.impact === 'negative' ? '▲ Risk' : '—'}
                      </Text>
                    </View>
                  ))}

                  {auditRisk.recommendations.length > 0 && (
                    <>
                      <Text style={styles.factorsTitle}>Recommendations</Text>
                      {auditRisk.recommendations.map((rec, i) => (
                        <View key={i} style={styles.recRow}>
                          <View style={styles.recRowDot} />
                          <Text style={styles.recRowText}>{rec}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyDesc}>Add location data to see your risk analysis</Text>
                </View>
              )}
            </View>
          )}

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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: Typography.sm, color: Colors.textTertiary },

  statsScroll: { maxHeight: 80 },
  statsContent: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.sm },
  quickStat: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minWidth: 88,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickStatValue: { fontSize: Typography.xl, fontWeight: Typography.bold },
  quickStatLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  tabActive: { backgroundColor: Colors.backgroundTertiary },
  tabText: { fontSize: Typography.xs, color: Colors.textTertiary, fontWeight: Typography.medium },
  tabTextActive: { color: Colors.textPrimary, fontWeight: Typography.semibold },
  tabBadge: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: Colors.primary },
  tabBadgeText: { fontSize: 9, color: Colors.textTertiary, fontWeight: Typography.bold },
  tabBadgeTextActive: { color: Colors.white },

  scroll: { paddingHorizontal: Spacing.base },
  tabContent: { gap: Spacing.md },

  // Insight card
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    gap: Spacing.md,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightHeaderText: { flex: 1 },
  insightTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  insightMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 3 },
  priorityBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: { fontSize: 10, fontWeight: Typography.semibold, textTransform: 'uppercase' },
  insightCategory: { fontSize: Typography.xs, color: Colors.textTertiary },
  insightBody: { gap: Spacing.md },
  insightDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  actionItems: { gap: Spacing.sm },
  actionItemsTitle: { fontSize: Typography.xs, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  actionItemDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  actionItemText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },

  // Recommendation card
  recCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  recFlag: { fontSize: 24 },
  recInfo: { flex: 1 },
  recName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  recCountry: { fontSize: Typography.xs, color: Colors.textTertiary },
  recTypeBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  recTypeText: { fontSize: 10, fontWeight: Typography.bold, textTransform: 'uppercase' },
  recHighlight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recHighlightText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  recBody: { gap: Spacing.md },
  recDays: { fontSize: Typography.xs, color: Colors.textTertiary },
  recColumns: { flexDirection: 'row', gap: Spacing.md },
  recColumn: { flex: 1, gap: Spacing.sm },
  recColumnTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  recBullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  recBulletText: { flex: 1, fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 16 },
  recDisclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  recDisclaimerText: { flex: 1, fontSize: Typography.xs, color: Colors.textTertiary, lineHeight: 14, fontStyle: 'italic' },

  // Opportunities
  oppHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.glassBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  oppHeaderText: { flex: 1, fontSize: Typography.xs, color: Colors.textTertiary, lineHeight: 16 },

  // Risk tab
  riskOverview: { gap: Spacing.md },
  riskOverviewTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  riskScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  riskScoreValue: { fontSize: Typography['4xl'], fontWeight: Typography.bold },
  riskScoreMax: { fontSize: Typography.lg, color: Colors.textTertiary },
  riskDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },

  factorsTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary, marginTop: Spacing.sm },
  factorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  factorText: { flex: 1 },
  factorDesc: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium },
  factorDetails: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 3 },
  factorImpact: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recRowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 6 },
  recRowText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },

  emptyState: {
    alignItems: 'center',
    padding: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  emptyDesc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
