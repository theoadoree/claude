import {
  Jurisdiction,
  LocationEntry,
  JurisdictionStat,
  AuditRisk,
  RiskFactor,
  RiskLevel,
  TaxPlanningInsight,
} from '../types';

// ─── Default Tax Rules ─────────────────────────────────────────────────────────
const DEFAULT_RULES: Record<string, { threshold: number; safeHarbor: number; description: string }> = {
  'New York': {
    threshold: 183,
    safeHarbor: 183,
    description: 'Statutory resident if domiciled or >183 days with permanent place of abode',
  },
  'California': {
    threshold: 183,
    safeHarbor: 183,
    description: 'Resident if domiciled or spend >183 days in California',
  },
  'New Jersey': { threshold: 183, safeHarbor: 183, description: 'Resident if domiciled or >183 days' },
  'Illinois': { threshold: 183, safeHarbor: 183, description: 'Resident if domiciled or >183 days' },
  'Massachusetts': { threshold: 183, safeHarbor: 183, description: 'Resident if domiciled or >183 days' },
  'Pennsylvania': { threshold: 183, safeHarbor: 183, description: 'Resident if domiciled or >183 days' },
  'Connecticut': { threshold: 183, safeHarbor: 183, description: 'Resident if domiciled or >183 days' },
  'Florida': { threshold: 366, safeHarbor: 366, description: 'No state income tax — safe destination' },
  'Texas': { threshold: 366, safeHarbor: 366, description: 'No state income tax — safe destination' },
  'Nevada': { threshold: 366, safeHarbor: 366, description: 'No state income tax — safe destination' },
  'United States': {
    threshold: 183,
    safeHarbor: 183,
    description: 'Substantial Presence Test: 183 days in current + weighted prior years',
  },
  'United Kingdom': {
    threshold: 183,
    safeHarbor: 90,
    description: 'Statutory Residence Test: resident if >183 days in a tax year',
  },
};

function getDaysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

function getRuleForJurisdiction(jurisdiction: Jurisdiction): {
  threshold: number;
  safeHarbor: number;
  description: string;
} {
  if (jurisdiction.taxRule) {
    return {
      threshold: jurisdiction.taxRule.residencyDayThreshold,
      safeHarbor: jurisdiction.taxRule.safeHarborDays,
      description: jurisdiction.taxRule.description,
    };
  }

  // Try to match by name
  const key = Object.keys(DEFAULT_RULES).find((k) =>
    jurisdiction.name.toLowerCase().includes(k.toLowerCase())
  );
  if (key) return DEFAULT_RULES[key];

  // Default rule
  return { threshold: 183, safeHarbor: 183, description: 'Default 183-day residency rule' };
}

// ─── Main Calculation Functions ───────────────────────────────────────────────
export function calculateJurisdictionStats(
  jurisdictions: Jurisdiction[],
  entries: LocationEntry[],
  year: number
): JurisdictionStat[] {
  const totalDays = getDaysInYear(year);

  return jurisdictions
    .filter((j) => j.isTracked)
    .map((jurisdiction) => {
      const rule = getRuleForJurisdiction(jurisdiction);

      // Count days spent in this jurisdiction
      const daysSpent = entries.filter((e) => {
        if (e.jurisdictionId === jurisdiction.id) return true;
        if (jurisdiction.name && e.jurisdictionName) {
          return e.jurisdictionName.toLowerCase().includes(jurisdiction.name.toLowerCase()) ||
            jurisdiction.name.toLowerCase().includes(e.jurisdictionName.toLowerCase());
        }
        if (e.state && jurisdiction.state) {
          return e.state.toLowerCase() === jurisdiction.state.toLowerCase();
        }
        return false;
      }).length;

      const daysAllowed = rule.threshold;
      const daysRemaining = Math.max(0, daysAllowed - daysSpent);
      const percentageUsed = Math.min(100, (daysSpent / daysAllowed) * 100);

      let riskLevel: RiskLevel = 'low';
      if (percentageUsed >= 100) riskLevel = 'critical';
      else if (percentageUsed >= 85) riskLevel = 'high';
      else if (percentageUsed >= 70) riskLevel = 'moderate';

      return {
        jurisdiction,
        daysSpent,
        daysAllowed,
        daysRemaining,
        percentageUsed,
        riskLevel,
        trend: 'stable' as const,
      };
    })
    .sort((a, b) => b.daysSpent - a.daysSpent);
}

export function calculateAuditRisk(
  stats: JurisdictionStat[],
  entries: LocationEntry[]
): AuditRisk {
  const factors: RiskFactor[] = [];
  let score = 0;

  // Factor: Missing days
  const missingDaysPercent = entries.length < 180 ? (180 - entries.length) / 180 : 0;
  if (missingDaysPercent > 0.5) {
    factors.push({
      description: 'Large number of untracked days',
      impact: 'negative',
      weight: 0.3,
      details: `${Math.round(missingDaysPercent * 100)}% of days are unverified`,
    });
    score += missingDaysPercent * 30;
  }

  // Factor: High-tax jurisdictions near threshold
  const nearThresholdJurisdictions = stats.filter(
    (s) => s.percentageUsed >= 70 && s.percentageUsed < 100
  );
  if (nearThresholdJurisdictions.length > 0) {
    factors.push({
      description: `${nearThresholdJurisdictions.length} jurisdiction(s) approaching day limits`,
      impact: 'negative',
      weight: 0.25,
      details: nearThresholdJurisdictions.map((j) => `${j.jurisdiction.name}: ${j.daysRemaining} days left`).join(', '),
    });
    score += nearThresholdJurisdictions.length * 15;
  }

  // Factor: Exceeded thresholds
  const exceededJurisdictions = stats.filter((s) => s.percentageUsed >= 100);
  if (exceededJurisdictions.length > 0) {
    factors.push({
      description: `Day limits exceeded in ${exceededJurisdictions.length} jurisdiction(s)`,
      impact: 'negative',
      weight: 0.4,
      details: exceededJurisdictions.map((j) => j.jurisdiction.name).join(', '),
    });
    score += exceededJurisdictions.length * 25;
  }

  // Factor: Good documentation
  const verifiedEntries = entries.filter((e) => e.isVerified).length;
  const verifiedPercent = entries.length > 0 ? verifiedEntries / entries.length : 0;
  if (verifiedPercent > 0.8) {
    factors.push({
      description: 'Strong location documentation',
      impact: 'positive',
      weight: 0.2,
      details: `${Math.round(verifiedPercent * 100)}% of days verified`,
    });
    score -= 10;
  } else if (verifiedPercent < 0.3 && entries.length > 30) {
    factors.push({
      description: 'Weak location documentation',
      impact: 'negative',
      weight: 0.2,
      details: `Only ${Math.round(verifiedPercent * 100)}% of days verified`,
    });
    score += 15;
  }

  // Factor: Multiple high-tax jurisdictions with significant days
  const highTaxExposure = stats.filter((s) => s.daysSpent > 30).length;
  if (highTaxExposure > 2) {
    factors.push({
      description: 'Multi-state/jurisdiction exposure',
      impact: 'negative',
      weight: 0.15,
      details: 'Presence in multiple jurisdictions increases audit complexity',
    });
    score += highTaxExposure * 5;
  }

  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  let level: RiskLevel = 'low';
  if (clampedScore >= 75) level = 'critical';
  else if (clampedScore >= 50) level = 'high';
  else if (clampedScore >= 25) level = 'moderate';

  const recommendations: string[] = [];
  if (clampedScore >= 25) {
    recommendations.push('Maintain detailed daily location logs');
    recommendations.push('Keep receipts, boarding passes, and hotel confirmations');
  }
  if (exceededJurisdictions.length > 0) {
    recommendations.push('Consult a tax attorney regarding exceeded day counts');
  }
  if (verifiedPercent < 0.5) {
    recommendations.push('Verify more location entries with supporting documents');
  }
  if (nearThresholdJurisdictions.length > 0) {
    recommendations.push('Monitor remaining days carefully in jurisdictions near limits');
  }

  return { score: clampedScore, level, factors, recommendations };
}

export function generateInsights(
  stats: JurisdictionStat[],
  auditRisk: AuditRisk,
  entries: LocationEntry[],
  year: number
): TaxPlanningInsight[] {
  const insights: TaxPlanningInsight[] = [];
  const today = new Date();
  const daysLeftInYear = Math.floor(
    (new Date(year, 11, 31).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Compliance insights
  stats.forEach((stat) => {
    if (stat.riskLevel === 'critical') {
      insights.push({
        id: `critical-${stat.jurisdiction.id}`,
        title: `Day limit exceeded: ${stat.jurisdiction.name}`,
        description: `You have spent ${stat.daysSpent} days in ${stat.jurisdiction.name}, exceeding the ${stat.daysAllowed}-day threshold. You may be subject to tax obligations.`,
        priority: 'urgent',
        category: 'compliance',
        actionItems: [
          'Consult a tax advisor immediately',
          'Gather all supporting travel documentation',
          'Review filing requirements for this jurisdiction',
        ],
      });
    } else if (stat.riskLevel === 'high' && daysLeftInYear > 0) {
      insights.push({
        id: `warning-${stat.jurisdiction.id}`,
        title: `Approaching limit: ${stat.jurisdiction.name}`,
        description: `Only ${stat.daysRemaining} days remaining in ${stat.jurisdiction.name} before the ${stat.daysAllowed}-day threshold.`,
        priority: 'high',
        category: 'risk',
        actionItems: [
          `Limit future visits to ${stat.jurisdiction.name}`,
          'Plan travel to avoid exceeding the threshold',
          'Consider whether establishing domicile elsewhere would help',
        ],
        deadline: new Date(year, 11, 31).toISOString(),
      });
    }
  });

  // Missing days insight
  const missingDays = getDaysInYear(year) - entries.length;
  if (missingDays > 30 && year === today.getFullYear()) {
    insights.push({
      id: 'missing-days',
      title: `${missingDays} untracked days this year`,
      description: 'Gaps in your location history increase audit risk. Tax authorities expect complete records.',
      priority: missingDays > 90 ? 'high' : 'medium',
      category: 'compliance',
      actionItems: [
        'Enable automatic location tracking',
        'Use the calendar view to fill in missing days',
        'Import travel records from credit cards or airlines',
      ],
    });
  }

  // Optimization: Low-tax jurisdiction opportunities
  const primaryNoTaxStates = ['Florida', 'Texas', 'Nevada', 'Wyoming', 'South Dakota', 'Washington', 'Alaska'];
  const primaryJurisdiction = stats.find((s) => s.jurisdiction.isPrimary);
  if (primaryJurisdiction && !primaryNoTaxStates.some((s) => primaryJurisdiction.jurisdiction.name.includes(s))) {
    insights.push({
      id: 'domicile-opportunity',
      title: 'Consider a no-income-tax domicile',
      description: 'Establishing domicile in a state with no income tax (Florida, Texas, Nevada) could significantly reduce your tax burden.',
      priority: 'medium',
      category: 'optimization',
      actionItems: [
        'Spend 183+ days in the new state',
        'Obtain a local driver\'s license and register to vote',
        'Update bank accounts, estate documents, and professional registrations',
        'Consult a tax attorney about domicile change requirements',
      ],
    });
  }

  // Puerto Rico Act 60 opportunity
  if (!stats.some((s) => s.jurisdiction.name.includes('Puerto Rico')) && entries.length > 100) {
    insights.push({
      id: 'pr-act60',
      title: 'Puerto Rico Act 60 opportunity',
      description: 'Under Puerto Rico Act 60, qualifying residents may pay 0% tax on passive income and 4% on export services income.',
      priority: 'low',
      category: 'opportunity',
      actionItems: [
        'Spend at least 183 days per year in Puerto Rico',
        'Establish a bona fide residence in Puerto Rico',
        'Apply for Act 60 export services or investor resident individual decrees',
        'Consult a PR Act 60 specialist',
      ],
    });
  }

  // Audit defense
  if (auditRisk.score > 40) {
    insights.push({
      id: 'audit-prep',
      title: 'Strengthen your audit defense',
      description: 'Your current risk score suggests you should build a stronger documentation trail.',
      priority: 'high',
      category: 'risk',
      actionItems: [
        'Upload boarding passes and hotel confirmations for all travel',
        'Enable automatic location tracking',
        'Log business meetings and activities by date',
        'Consider using a CPA specializing in multi-state taxation',
      ],
    });
  }

  return insights.sort((a, b) => {
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}
