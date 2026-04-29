package com.taxtrack.app.data.models

data class LocationEntry(
    val id: String,
    val date: String, // YYYY-MM-DD
    val jurisdictionId: String,
    val city: String,
    val state: String,
    val country: String,
    val latitude: Double,
    val longitude: Double,
    val activityType: String, // work/personal/transit/unknown
    val isVerified: Boolean,
    val source: String, // auto/manual/import
    val notes: String,
    val documentIds: List<String>
)

data class Jurisdiction(
    val id: String,
    val name: String,
    val type: String, // state/country/territory
    val color: String,
    val dayLimit: Int,
    val isTracked: Boolean,
    val isPrimary: Boolean
)

data class TaxDocument(
    val id: String,
    val type: String, // flight/hotel/receipt/photo/other
    val title: String,
    val date: String,
    val imagePath: String?,
    val notes: String,
    val extractedData: Map<String, String>
)

data class UserProfile(
    val name: String,
    val primaryJurisdictionId: String,
    val trackedJurisdictionIds: List<String>,
    val hasCompletedOnboarding: Boolean
)

data class AuditRisk(
    val score: Int,
    val level: String, // low/moderate/high/critical
    val factors: List<RiskFactor>,
    val recommendations: List<String>
)

data class RiskFactor(
    val description: String,
    val impact: String,
    val isPositive: Boolean
)

data class TaxPlanningInsight(
    val id: String,
    val type: String,
    val priority: String,
    val title: String,
    val message: String,
    val actionItems: List<String>
)

data class JurisdictionStats(
    val jurisdictionId: String,
    val name: String,
    val color: String,
    val daysSpent: Int,
    val dayLimit: Int,
    val percentUsed: Float,
    val riskLevel: String
)

data class AppState(
    val profile: UserProfile = UserProfile(
        name = "",
        primaryJurisdictionId = "",
        trackedJurisdictionIds = emptyList(),
        hasCompletedOnboarding = false
    ),
    val jurisdictions: List<Jurisdiction> = emptyList(),
    val entries: List<LocationEntry> = emptyList(),
    val documents: List<TaxDocument> = emptyList(),
    val jurisdictionStats: List<JurisdictionStats> = emptyList(),
    val auditRisk: AuditRisk = AuditRisk(
        score = 100,
        level = "low",
        factors = emptyList(),
        recommendations = emptyList()
    ),
    val insights: List<TaxPlanningInsight> = emptyList(),
    val isTrackingActive: Boolean = false,
    val selectedYear: Int = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
)
