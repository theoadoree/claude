package com.taxtrack.app.services

import com.taxtrack.app.data.models.*
import java.util.Calendar

object TaxCalculationService {

    fun calculateJurisdictionStats(
        entries: List<LocationEntry>,
        jurisdictions: List<Jurisdiction>
    ): List<JurisdictionStats> {
        val dayCounts = mutableMapOf<String, MutableSet<String>>()

        for (entry in entries) {
            dayCounts.getOrPut(entry.jurisdictionId) { mutableSetOf() }.add(entry.date)
        }

        val stats = mutableListOf<JurisdictionStats>()

        for (jurisdiction in jurisdictions) {
            if (!jurisdiction.isTracked && !jurisdiction.isPrimary) continue

            val days = dayCounts[jurisdiction.id]?.size ?: 0
            val percentUsed = if (jurisdiction.dayLimit > 0) {
                days.toFloat() / jurisdiction.dayLimit.toFloat()
            } else 0f

            val riskLevel = when {
                percentUsed >= 1.0f -> "critical"
                percentUsed >= 0.85f -> "high"
                percentUsed >= 0.70f -> "moderate"
                else -> "low"
            }

            stats.add(
                JurisdictionStats(
                    jurisdictionId = jurisdiction.id,
                    name = jurisdiction.name,
                    color = jurisdiction.color,
                    daysSpent = days,
                    dayLimit = jurisdiction.dayLimit,
                    percentUsed = percentUsed,
                    riskLevel = riskLevel
                )
            )
        }

        return stats.sortedByDescending { it.daysSpent }
    }

    fun calculateAuditRisk(
        entries: List<LocationEntry>,
        stats: List<JurisdictionStats>,
        year: Int
    ): AuditRisk {
        var score = 100
        val factors = mutableListOf<RiskFactor>()
        val recommendations = mutableListOf<String>()

        // Calculate days in year
        val cal = Calendar.getInstance()
        val isCurrentYear = cal.get(Calendar.YEAR) == year
        val totalDaysInYear = if (isCurrentYear) cal.get(Calendar.DAY_OF_YEAR) else 365

        // Missing days check
        val coveredDays = entries.map { it.date }.toSet().size
        val missingPercent = 1.0f - (coveredDays.toFloat() / totalDaysInYear.toFloat())

        if (missingPercent > 0.5f) {
            score -= 30
            factors.add(
                RiskFactor(
                    description = "More than 50% of days have no location data",
                    impact = "-30 points",
                    isPositive = false
                )
            )
            recommendations.add("Log your location daily to reduce audit risk. Missing records are a major red flag.")
        }

        // Jurisdiction risk levels
        for (stat in stats) {
            when (stat.riskLevel) {
                "moderate" -> {
                    score -= 15
                    factors.add(
                        RiskFactor(
                            description = "${stat.name}: ${stat.daysSpent} days (${(stat.percentUsed * 100).toInt()}% of limit)",
                            impact = "-15 points",
                            isPositive = false
                        )
                    )
                    recommendations.add("Monitor days in ${stat.name} - approaching the ${stat.dayLimit}-day threshold.")
                }
                "high" -> {
                    score -= 20
                    factors.add(
                        RiskFactor(
                            description = "${stat.name}: ${stat.daysSpent} days (${(stat.percentUsed * 100).toInt()}% of limit)",
                            impact = "-20 points",
                            isPositive = false
                        )
                    )
                    recommendations.add("Critical: Reduce time in ${stat.name} immediately. Only ${(stat.dayLimit - stat.daysSpent)} days remaining.")
                }
                "critical" -> {
                    score -= 25
                    factors.add(
                        RiskFactor(
                            description = "${stat.name}: ${stat.daysSpent} days - EXCEEDED ${stat.dayLimit}-day limit",
                            impact = "-25 points",
                            isPositive = false
                        )
                    )
                    recommendations.add("URGENT: You have exceeded the ${stat.dayLimit}-day limit in ${stat.name}. Consult a tax attorney immediately.")
                }
            }
        }

        // Verification check
        val verifiedCount = entries.count { it.isVerified }
        val verifiedPercent = if (entries.isNotEmpty()) verifiedCount.toFloat() / entries.size else 0f

        when {
            verifiedPercent > 0.8f -> {
                score += 10
                factors.add(
                    RiskFactor(
                        description = "Over 80% of entries have supporting documentation",
                        impact = "+10 points",
                        isPositive = true
                    )
                )
            }
            verifiedPercent < 0.3f && entries.isNotEmpty() -> {
                score -= 15
                factors.add(
                    RiskFactor(
                        description = "Less than 30% of entries have supporting documentation",
                        impact = "-15 points",
                        isPositive = false
                    )
                )
                recommendations.add("Attach receipts, boarding passes, or photos to verify your location entries.")
            }
        }

        // Multi-jurisdiction penalty
        val heavyJurisdictions = stats.count { it.daysSpent >= 30 }
        if (heavyJurisdictions > 2) {
            val penalty = (heavyJurisdictions - 2) * 5
            score -= penalty
            factors.add(
                RiskFactor(
                    description = "$heavyJurisdictions jurisdictions with 30+ days spent",
                    impact = "-$penalty points",
                    isPositive = false
                )
            )
            recommendations.add("Spending significant time in multiple jurisdictions increases audit risk. Consider consolidating your presence.")
        }

        score = score.coerceIn(0, 100)

        val level = when {
            score <= 30 -> "critical"
            score <= 59 -> "high"
            score <= 79 -> "moderate"
            else -> "low"
        }

        if (score >= 80) {
            factors.add(
                RiskFactor(
                    description = "Location tracking is consistent and well-documented",
                    impact = "Good standing",
                    isPositive = true
                )
            )
        }

        return AuditRisk(
            score = score,
            level = level,
            factors = factors,
            recommendations = recommendations
        )
    }

    fun generateInsights(
        stats: List<JurisdictionStats>,
        risk: AuditRisk,
        profile: UserProfile,
        jurisdictions: List<Jurisdiction>
    ): List<TaxPlanningInsight> {
        val insights = mutableListOf<TaxPlanningInsight>()

        // High-risk jurisdictions
        stats.filter { it.riskLevel == "high" || it.riskLevel == "critical" }.forEach { stat ->
            insights.add(
                TaxPlanningInsight(
                    id = "risk_${stat.jurisdictionId}",
                    type = "warning",
                    priority = "high",
                    title = "Days Limit Alert: ${stat.name}",
                    message = "You have spent ${stat.daysSpent} of ${stat.dayLimit} allowed days in ${stat.name} this year.",
                    actionItems = listOf(
                        "Review upcoming travel plans",
                        "Consider remote work options",
                        "Consult with a tax professional"
                    )
                )
            )
        }

        // Suggest no-income-tax states
        val noTaxStates = listOf("fl", "tx", "nv", "wa")
        val currentStats = stats.map { it.jurisdictionId }
        val suggestedStates = noTaxStates.filter { !currentStats.contains(it) }

        if (suggestedStates.isNotEmpty()) {
            insights.add(
                TaxPlanningInsight(
                    id = "opportunity_no_tax",
                    type = "opportunity",
                    priority = "medium",
                    title = "Tax-Friendly State Opportunity",
                    message = "States like Florida, Texas, Nevada, and Washington have no state income tax. Establishing domicile there could reduce your tax burden.",
                    actionItems = listOf(
                        "Spend 183+ days in a no-income-tax state",
                        "Establish strong domicile ties (home, bank, license)",
                        "Terminate lease/mortgage in high-tax state",
                        "Update voter registration and vehicle registration"
                    )
                )
            )
        }

        // Documentation insight
        insights.add(
            TaxPlanningInsight(
                id = "documentation",
                type = "action",
                priority = if (risk.score < 60) "high" else "medium",
                title = "Strengthen Your Documentation",
                message = "Maintain a contemporaneous travel log with receipts and boarding passes for every trip.",
                actionItems = listOf(
                    "Upload boarding passes within 24 hours of travel",
                    "Save hotel receipts to the evidence vault",
                    "Photograph business cards from meetings",
                    "Note purpose of each trip (work/personal)"
                )
            )
        )

        // Puerto Rico Act 60
        if (!currentStats.contains("pr")) {
            insights.add(
                TaxPlanningInsight(
                    id = "opportunity_pr",
                    type = "opportunity",
                    priority = "low",
                    title = "Puerto Rico Act 60 Opportunity",
                    message = "Puerto Rico Act 60 offers 0-4% income tax for qualifying individuals who spend 183+ days on the island.",
                    actionItems = listOf(
                        "Spend 183+ days in Puerto Rico",
                        "Purchase residential property",
                        "Make charitable contributions to PR nonprofits",
                        "Apply for Act 60 individual resident investor decree"
                    )
                )
            )
        }

        // Year-end planning
        insights.add(
            TaxPlanningInsight(
                id = "yearend_planning",
                type = "planning",
                priority = "medium",
                title = "Year-End Tax Planning",
                message = "Review your jurisdiction day counts before December 31st to ensure compliance with all residence rules.",
                actionItems = listOf(
                    "Verify all entries are logged through year-end",
                    "Confirm primary residence day count exceeds requirements",
                    "Schedule consultation with tax advisor",
                    "Prepare contemporaneous records binder"
                )
            )
        )

        return insights
    }

    fun getJurisdictionColor(riskLevel: String): String {
        return when (riskLevel) {
            "low" -> "#30D158"
            "moderate" -> "#FF9F0A"
            "high" -> "#FF453A"
            "critical" -> "#8E2929"
            else -> "#30D158"
        }
    }
}
