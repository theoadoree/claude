import Foundation

// MARK: - TaxCalculationService
enum TaxCalculationService {

    // MARK: - Calculate Jurisdiction Stats
    static func calculateJurisdictionStats(
        entries: [LocationEntry],
        jurisdictions: [Jurisdiction],
        year: Int
    ) -> [JurisdictionStats] {
        let yearEntries = entries.filter { $0.date.hasPrefix("\(year)") }

        return jurisdictions.filter { $0.isTracked }.map { jurisdiction in
            let jEntries = yearEntries.filter { $0.jurisdictionId == jurisdiction.id }
            // Count unique days
            let uniqueDays = Set(jEntries.map { $0.date }).count
            let verifiedCount = jEntries.filter { $0.isVerified }.count
            let percentage = jurisdiction.dayLimit > 0
                ? Double(uniqueDays) / Double(jurisdiction.dayLimit) * 100
                : 0

            return JurisdictionStats(
                jurisdictionId: jurisdiction.id,
                jurisdictionName: jurisdiction.name,
                color: jurisdiction.color,
                daysSpent: uniqueDays,
                dayLimit: jurisdiction.dayLimit,
                percentage: percentage,
                entriesCount: jEntries.count,
                verifiedCount: verifiedCount
            )
        }.sorted { $0.daysSpent > $1.daysSpent }
    }

    // MARK: - Calculate Audit Risk
    static func calculateAuditRisk(
        stats: [JurisdictionStats],
        yearSummary: YearSummary
    ) -> AuditRisk {
        var score = 100
        var factors: [AuditRiskFactor] = []
        var recommendations: [String] = []

        let totalEntries = stats.reduce(0) { $0 + $1.entriesCount }
        let totalVerified = stats.reduce(0) { $0 + $1.verifiedCount }

        // Missing days penalty
        let missingPercent = yearSummary.totalDays > 0
            ? Double(yearSummary.missingDays) / Double(yearSummary.totalDays)
            : 0
        if missingPercent > 0.5 {
            score -= 30
            factors.append(AuditRiskFactor(
                description: "Missing location data for \(Int(missingPercent * 100))% of the year",
                impact: -30,
                isPositive: false
            ))
            recommendations.append("Add location entries for missing days to improve audit trail.")
        } else if missingPercent > 0.2 {
            score -= 10
            factors.append(AuditRiskFactor(
                description: "Missing location data for \(Int(missingPercent * 100))% of the year",
                impact: -10,
                isPositive: false
            ))
            recommendations.append("Fill in location gaps to strengthen your tax documentation.")
        }

        // Per-jurisdiction penalties
        var multiJurisdictionCount = 0
        for stat in stats {
            let ratio = stat.dayLimit > 0 ? Double(stat.daysSpent) / Double(stat.dayLimit) : 0

            if stat.daysSpent >= 30 {
                multiJurisdictionCount += 1
            }

            if ratio >= 1.0 {
                score -= 25
                factors.append(AuditRiskFactor(
                    description: "\(stat.jurisdictionName): exceeded \(stat.dayLimit)-day limit (\(stat.daysSpent) days)",
                    impact: -25,
                    isPositive: false
                ))
                recommendations.append("You have exceeded the day limit for \(stat.jurisdictionName). Consult a tax professional immediately.")
            } else if ratio >= 0.85 {
                score -= 20
                factors.append(AuditRiskFactor(
                    description: "\(stat.jurisdictionName): at \(Int(ratio * 100))% of \(stat.dayLimit)-day limit",
                    impact: -20,
                    isPositive: false
                ))
                recommendations.append("Reduce time in \(stat.jurisdictionName) — you're within \(stat.dayLimit - stat.daysSpent) days of the tax threshold.")
            } else if ratio >= 0.70 {
                score -= 15
                factors.append(AuditRiskFactor(
                    description: "\(stat.jurisdictionName): at \(Int(ratio * 100))% of \(stat.dayLimit)-day limit",
                    impact: -15,
                    isPositive: false
                ))
                recommendations.append("Monitor your days in \(stat.jurisdictionName) carefully — you have \(stat.dayLimit - stat.daysSpent) days remaining.")
            }
        }

        // Multi-jurisdiction penalty
        if multiJurisdictionCount > 2 {
            let extraJurisdictions = multiJurisdictionCount - 2
            let penalty = extraJurisdictions * 5
            score -= penalty
            factors.append(AuditRiskFactor(
                description: "Presence in \(multiJurisdictionCount) jurisdictions with 30+ days each",
                impact: -penalty,
                isPositive: false
            ))
            recommendations.append("Consider consolidating your time to fewer jurisdictions to reduce audit complexity.")
        }

        // Verification bonus/penalty
        if totalEntries > 0 {
            let verifiedRatio = Double(totalVerified) / Double(totalEntries)
            if verifiedRatio > 0.80 {
                score += 10
                factors.append(AuditRiskFactor(
                    description: "\(Int(verifiedRatio * 100))% of entries are verified with documentation",
                    impact: 10,
                    isPositive: true
                ))
            } else if verifiedRatio < 0.30 {
                score -= 15
                factors.append(AuditRiskFactor(
                    description: "Only \(Int(verifiedRatio * 100))% of entries have supporting documentation",
                    impact: -15,
                    isPositive: false
                ))
                recommendations.append("Add supporting documents (boarding passes, hotel receipts) to verify your location entries.")
            }
        } else {
            factors.append(AuditRiskFactor(
                description: "No location entries recorded",
                impact: 0,
                isPositive: false
            ))
            recommendations.append("Start tracking your location to build an audit-ready record.")
        }

        // Clamp score
        score = max(0, min(100, score))

        let level: RiskLevel
        switch score {
        case 80...100: level = .low
        case 60..<80:  level = .moderate
        case 31..<60:  level = .high
        default:       level = .critical
        }

        if recommendations.isEmpty {
            recommendations.append("Your tax residency tracking is in good shape. Keep maintaining detailed records.")
        }

        return AuditRisk(score: score, level: level, factors: factors, recommendations: recommendations)
    }

    // MARK: - Generate Insights
    static func generateInsights(
        stats: [JurisdictionStats],
        jurisdictions: [Jurisdiction],
        profile: UserProfile,
        yearSummary: YearSummary
    ) -> [TaxPlanningInsight] {
        var insights: [TaxPlanningInsight] = []

        for stat in stats {
            let ratio = stat.dayLimit > 0 ? Double(stat.daysSpent) / Double(stat.dayLimit) : 0
            let daysRemaining = stat.dayLimit - stat.daysSpent

            // Exceeded limit
            if ratio >= 1.0 {
                insights.append(TaxPlanningInsight(
                    type: .compliance,
                    priority: .urgent,
                    title: "Day Limit Exceeded: \(stat.jurisdictionName)",
                    message: "You have spent \(stat.daysSpent) days in \(stat.jurisdictionName), exceeding the \(stat.dayLimit)-day threshold. You may be considered a tax resident.",
                    actionItems: [
                        "Contact a tax professional immediately",
                        "File required tax returns for \(stat.jurisdictionName)",
                        "Document all income sources for this jurisdiction",
                        "Gather all supporting location evidence"
                    ],
                    jurisdictionId: stat.jurisdictionId
                ))
            } else if ratio >= 0.85 {
                // 85-99% of limit
                insights.append(TaxPlanningInsight(
                    type: .compliance,
                    priority: .high,
                    title: "Approaching Day Limit: \(stat.jurisdictionName)",
                    message: "You have \(daysRemaining) days remaining before reaching the \(stat.dayLimit)-day threshold in \(stat.jurisdictionName). Careful planning is required.",
                    actionItems: [
                        "Limit additional time in \(stat.jurisdictionName) to \(daysRemaining) days",
                        "Review upcoming travel plans",
                        "Consider consulting a tax advisor",
                        "Keep detailed documentation for this period"
                    ],
                    jurisdictionId: stat.jurisdictionId
                ))
            } else if ratio >= 0.70 {
                // 70-84% of limit
                insights.append(TaxPlanningInsight(
                    type: .compliance,
                    priority: .medium,
                    title: "Monitor Days: \(stat.jurisdictionName)",
                    message: "You are at \(Int(ratio * 100))% of the \(stat.dayLimit)-day limit in \(stat.jurisdictionName) with \(daysRemaining) days remaining.",
                    actionItems: [
                        "Track remaining days available: \(daysRemaining)",
                        "Plan future visits accordingly",
                        "Maintain documentation for all days"
                    ],
                    jurisdictionId: stat.jurisdictionId
                ))
            }
        }

        // Missing days insight
        let missingPercent = yearSummary.totalDays > 0
            ? Double(yearSummary.missingDays) / Double(yearSummary.totalDays)
            : 0
        if missingPercent > 0.1 {
            insights.append(TaxPlanningInsight(
                type: .risk,
                priority: .high,
                title: "Missing Location Data",
                message: "You have \(yearSummary.missingDays) untracked days in \(yearSummary.year). Tax authorities may question gaps in your location history.",
                actionItems: [
                    "Review and fill in missing days",
                    "Enable background location tracking",
                    "Import records from travel apps",
                    "Add manual entries for known trips"
                ]
            ))
        }

        // FL/TX primary domicile opportunity
        let noTaxStates = ["florida", "texas", "nevada", "washington_state"]
        let primaryJurisdiction = jurisdictions.first { $0.isPrimary }
        let isNoTaxPrimary = primaryJurisdiction.map { noTaxStates.contains($0.id) } ?? false

        let totalTrackedDays = stats.reduce(0) { $0 + $1.daysSpent }
        if isNoTaxPrimary && totalTrackedDays > 100 {
            insights.append(TaxPlanningInsight(
                type: .opportunity,
                priority: .medium,
                title: "Domicile Documentation Opportunity",
                message: "You are based in a no-income-tax state. Strengthen your domicile evidence to protect your residency status.",
                actionItems: [
                    "Ensure primary home, driver's license, and voter registration are in \(primaryJurisdiction?.name ?? "your state")",
                    "Document community ties (clubs, religious organizations, doctors)",
                    "Keep records showing intent to remain",
                    "Minimize contacts in high-tax states"
                ],
                jurisdictionId: primaryJurisdiction?.id
            ))
        } else if !isNoTaxPrimary && totalTrackedDays > 50 {
            // Suggest no-tax state opportunity
            insights.append(TaxPlanningInsight(
                type: .opportunity,
                priority: .low,
                title: "Tax Savings Opportunity",
                message: "Establishing domicile in a no-income-tax state like Florida or Texas could significantly reduce your tax burden.",
                actionItems: [
                    "Research Florida, Texas, Nevada, or Washington as potential domicile states",
                    "Consult with a tax planning attorney",
                    "Understand domicile change requirements",
                    "Plan a multi-year transition if applicable"
                ]
            ))
        }

        // Puerto Rico Act 60 opportunity
        let prStats = stats.first { $0.jurisdictionId == "puerto_rico" }
        if let pr = prStats {
            if pr.daysSpent > 0 && pr.daysSpent < 183 {
                insights.append(TaxPlanningInsight(
                    type: .opportunity,
                    priority: .medium,
                    title: "Puerto Rico Act 60 Potential",
                    message: "You've spent \(pr.daysSpent) days in Puerto Rico. With 183+ days and Act 60 status, you could benefit from 4% corporate tax and 0% capital gains tax.",
                    actionItems: [
                        "Research Puerto Rico Act 60 eligibility requirements",
                        "Consult with a Puerto Rico tax specialist",
                        "Plan additional time in Puerto Rico if beneficial",
                        "Understand the bona fide residency requirements"
                    ],
                    jurisdictionId: "puerto_rico"
                ))
            } else if pr.daysSpent >= 183 {
                insights.append(TaxPlanningInsight(
                    type: .compliance,
                    priority: .high,
                    title: "Puerto Rico Bona Fide Resident",
                    message: "You've met the 183-day presence test for Puerto Rico bona fide residency. Ensure you have proper Act 60 decree if applicable.",
                    actionItems: [
                        "Verify Act 60 decree is in place if applicable",
                        "File Puerto Rico tax returns",
                        "Document all income sources",
                        "Confirm annual filing requirements"
                    ],
                    jurisdictionId: "puerto_rico"
                ))
            }
        }

        // Sort by priority
        return insights.sorted { $0.priority < $1.priority }
    }
}
