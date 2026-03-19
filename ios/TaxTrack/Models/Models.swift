import Foundation
import SwiftUI

// MARK: - Activity Type
enum ActivityType: String, Codable, CaseIterable {
    case work
    case personal
    case transit
    case unknown

    var displayName: String {
        switch self {
        case .work: return "Work"
        case .personal: return "Personal"
        case .transit: return "Transit"
        case .unknown: return "Unknown"
        }
    }

    var icon: String {
        switch self {
        case .work: return "briefcase.fill"
        case .personal: return "person.fill"
        case .transit: return "airplane"
        case .unknown: return "questionmark.circle"
        }
    }
}

// MARK: - Entry Source
enum EntrySource: String, Codable, CaseIterable {
    case auto
    case manual
    case imported = "import"

    var displayName: String {
        switch self {
        case .auto: return "Auto"
        case .manual: return "Manual"
        case .imported: return "Imported"
        }
    }
}

// MARK: - Jurisdiction Type
enum JurisdictionType: String, Codable, CaseIterable {
    case state
    case country
    case territory

    var displayName: String {
        switch self {
        case .state: return "State"
        case .country: return "Country"
        case .territory: return "Territory"
        }
    }
}

// MARK: - Document Type
enum DocumentType: String, Codable, CaseIterable {
    case flight
    case hotel
    case receipt
    case photo
    case screenshot
    case other

    var displayName: String {
        switch self {
        case .flight: return "Flight"
        case .hotel: return "Hotel"
        case .receipt: return "Receipt"
        case .photo: return "Photo"
        case .screenshot: return "Screenshot"
        case .other: return "Other"
        }
    }

    var icon: String {
        switch self {
        case .flight: return "airplane"
        case .hotel: return "building.2.fill"
        case .receipt: return "doc.text.fill"
        case .photo: return "photo.fill"
        case .screenshot: return "camera.viewfinder"
        case .other: return "doc.fill"
        }
    }
}

// MARK: - Tax Rule Type
enum TaxRuleType: String, Codable, CaseIterable {
    case substantial_presence
    case statutory_residence
    case domicile

    var displayName: String {
        switch self {
        case .substantial_presence: return "Substantial Presence"
        case .statutory_residence: return "Statutory Residence"
        case .domicile: return "Domicile"
        }
    }
}

// MARK: - Risk Level
enum RiskLevel: String, Codable {
    case low
    case moderate
    case high
    case critical

    var displayName: String {
        switch self {
        case .low: return "Low"
        case .moderate: return "Moderate"
        case .high: return "High"
        case .critical: return "Critical"
        }
    }

    var color: Color {
        switch self {
        case .low: return Color(hex: "#30D158")
        case .moderate: return Color(hex: "#FF9F0A")
        case .high: return Color(hex: "#FF453A")
        case .critical: return Color(hex: "#8E2929")
        }
    }

    var icon: String {
        switch self {
        case .low: return "checkmark.shield.fill"
        case .moderate: return "exclamationmark.triangle.fill"
        case .high: return "xmark.shield.fill"
        case .critical: return "exclamationmark.octagon.fill"
        }
    }
}

// MARK: - Insight Type
enum InsightType: String, Codable {
    case compliance
    case optimization
    case risk
    case opportunity

    var displayName: String {
        switch self {
        case .compliance: return "Compliance"
        case .optimization: return "Optimization"
        case .risk: return "Risk"
        case .opportunity: return "Opportunity"
        }
    }

    var icon: String {
        switch self {
        case .compliance: return "checkmark.seal.fill"
        case .optimization: return "arrow.up.right.circle.fill"
        case .risk: return "exclamationmark.triangle.fill"
        case .opportunity: return "lightbulb.fill"
        }
    }

    var color: Color {
        switch self {
        case .compliance: return Color(hex: "#0A84FF")
        case .optimization: return Color(hex: "#30D158")
        case .risk: return Color(hex: "#FF453A")
        case .opportunity: return Color(hex: "#FF9F0A")
        }
    }
}

// MARK: - Insight Priority
enum InsightPriority: String, Codable, Comparable {
    case urgent
    case high
    case medium
    case low

    static func < (lhs: InsightPriority, rhs: InsightPriority) -> Bool {
        let order: [InsightPriority] = [.urgent, .high, .medium, .low]
        return (order.firstIndex(of: lhs) ?? 0) < (order.firstIndex(of: rhs) ?? 0)
    }

    var displayName: String {
        switch self {
        case .urgent: return "Urgent"
        case .high: return "High"
        case .medium: return "Medium"
        case .low: return "Low"
        }
    }

    var color: Color {
        switch self {
        case .urgent: return Color(hex: "#FF453A")
        case .high: return Color(hex: "#FF9F0A")
        case .medium: return Color(hex: "#0A84FF")
        case .low: return Color(hex: "#30D158")
        }
    }
}

// MARK: - LocationEntry
struct LocationEntry: Identifiable, Codable, Equatable {
    var id: String
    var date: String  // YYYY-MM-DD
    var jurisdictionId: String
    var city: String
    var state: String
    var country: String
    var latitude: Double
    var longitude: Double
    var activityType: ActivityType
    var isVerified: Bool
    var source: EntrySource
    var notes: String
    var documentIds: [String]

    init(
        id: String = UUID().uuidString,
        date: String,
        jurisdictionId: String,
        city: String = "",
        state: String = "",
        country: String = "",
        latitude: Double = 0,
        longitude: Double = 0,
        activityType: ActivityType = .unknown,
        isVerified: Bool = false,
        source: EntrySource = .manual,
        notes: String = "",
        documentIds: [String] = []
    ) {
        self.id = id
        self.date = date
        self.jurisdictionId = jurisdictionId
        self.city = city
        self.state = state
        self.country = country
        self.latitude = latitude
        self.longitude = longitude
        self.activityType = activityType
        self.isVerified = isVerified
        self.source = source
        self.notes = notes
        self.documentIds = documentIds
    }

    var locationDescription: String {
        var parts: [String] = []
        if !city.isEmpty { parts.append(city) }
        if !state.isEmpty { parts.append(state) }
        if !country.isEmpty && country != "United States" { parts.append(country) }
        return parts.joined(separator: ", ")
    }
}

// MARK: - Jurisdiction
struct Jurisdiction: Identifiable, Codable, Equatable {
    var id: String
    var name: String
    var type: JurisdictionType
    var color: String  // hex color
    var dayLimit: Int
    var taxRule: String
    var isTracked: Bool
    var isPrimary: Bool

    init(
        id: String = UUID().uuidString,
        name: String,
        type: JurisdictionType = .state,
        color: String = "#0A84FF",
        dayLimit: Int = 183,
        taxRule: String = "",
        isTracked: Bool = true,
        isPrimary: Bool = false
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.color = color
        self.dayLimit = dayLimit
        self.taxRule = taxRule
        self.isTracked = isTracked
        self.isPrimary = isPrimary
    }

    var swiftUIColor: Color {
        Color(hex: color)
    }
}

// MARK: - Document
struct Document: Identifiable, Codable, Equatable {
    var id: String
    var type: DocumentType
    var title: String
    var date: String  // YYYY-MM-DD
    var imageData: Data?
    var notes: String
    var extractedData: [String: String]

    init(
        id: String = UUID().uuidString,
        type: DocumentType = .other,
        title: String,
        date: String,
        imageData: Data? = nil,
        notes: String = "",
        extractedData: [String: String] = [:]
    ) {
        self.id = id
        self.type = type
        self.title = title
        self.date = date
        self.imageData = imageData
        self.notes = notes
        self.extractedData = extractedData
    }
}

// MARK: - TaxRule
struct TaxRule: Identifiable, Codable, Equatable {
    var id: String { jurisdictionId }
    var jurisdictionId: String
    var name: String
    var threshold: Int
    var ruleType: TaxRuleType
    var description: String

    init(
        jurisdictionId: String,
        name: String,
        threshold: Int = 183,
        ruleType: TaxRuleType = .substantial_presence,
        description: String = ""
    ) {
        self.jurisdictionId = jurisdictionId
        self.name = name
        self.threshold = threshold
        self.ruleType = ruleType
        self.description = description
    }
}

// MARK: - AuditRisk Factor
struct AuditRiskFactor: Codable, Equatable, Identifiable {
    var id: String { description }
    var description: String
    var impact: Int
    var isPositive: Bool
}

// MARK: - AuditRisk
struct AuditRisk: Codable, Equatable {
    var score: Int  // 0-100
    var level: RiskLevel
    var factors: [AuditRiskFactor]
    var recommendations: [String]

    static var empty: AuditRisk {
        AuditRisk(score: 100, level: .low, factors: [], recommendations: [])
    }

    init(score: Int, level: RiskLevel, factors: [AuditRiskFactor], recommendations: [String]) {
        self.score = score
        self.level = level
        self.factors = factors
        self.recommendations = recommendations
    }
}

// MARK: - TaxPlanningInsight
struct TaxPlanningInsight: Identifiable, Codable, Equatable {
    var id: String
    var type: InsightType
    var priority: InsightPriority
    var title: String
    var message: String
    var actionItems: [String]
    var jurisdictionId: String?

    init(
        id: String = UUID().uuidString,
        type: InsightType,
        priority: InsightPriority,
        title: String,
        message: String,
        actionItems: [String] = [],
        jurisdictionId: String? = nil
    ) {
        self.id = id
        self.type = type
        self.priority = priority
        self.title = title
        self.message = message
        self.actionItems = actionItems
        self.jurisdictionId = jurisdictionId
    }
}

// MARK: - JurisdictionBreakdown
struct JurisdictionBreakdown: Codable, Equatable, Identifiable {
    var id: String { jurisdictionId }
    var jurisdictionId: String
    var days: Int
    var percentage: Double
}

// MARK: - YearSummary
struct YearSummary: Codable, Equatable {
    var year: Int
    var totalDays: Int
    var trackedDays: Int
    var missingDays: Int
    var jurisdictionBreakdowns: [JurisdictionBreakdown]

    static func empty(year: Int) -> YearSummary {
        let cal = Calendar.current
        var comps = DateComponents()
        comps.year = year
        let daysInYear: Int
        if let date = cal.date(from: comps) {
            daysInYear = cal.range(of: .day, in: .year, for: date)?.count ?? 365
        } else {
            daysInYear = 365
        }
        return YearSummary(year: year, totalDays: daysInYear, trackedDays: 0, missingDays: daysInYear, jurisdictionBreakdowns: [])
    }
}

// MARK: - UserProfile
struct UserProfile: Codable, Equatable {
    var name: String
    var primaryJurisdictionId: String
    var trackedJurisdictionIds: [String]
    var hasCompletedOnboarding: Bool

    init(
        name: String = "",
        primaryJurisdictionId: String = "",
        trackedJurisdictionIds: [String] = [],
        hasCompletedOnboarding: Bool = false
    ) {
        self.name = name
        self.primaryJurisdictionId = primaryJurisdictionId
        self.trackedJurisdictionIds = trackedJurisdictionIds
        self.hasCompletedOnboarding = hasCompletedOnboarding
    }

    static var `default`: UserProfile {
        UserProfile()
    }
}

// MARK: - JurisdictionStats (computed)
struct JurisdictionStats: Identifiable, Equatable {
    var id: String { jurisdictionId }
    var jurisdictionId: String
    var jurisdictionName: String
    var color: String
    var daysSpent: Int
    var dayLimit: Int
    var percentage: Double
    var entriesCount: Int
    var verifiedCount: Int

    var progressRatio: Double {
        guard dayLimit > 0 else { return 0 }
        return min(Double(daysSpent) / Double(dayLimit), 1.0)
    }

    var isOverLimit: Bool { daysSpent >= dayLimit }

    var riskLevel: RiskLevel {
        let ratio = Double(daysSpent) / Double(max(dayLimit, 1))
        if ratio >= 1.0 { return .critical }
        if ratio >= 0.85 { return .high }
        if ratio >= 0.70 { return .moderate }
        return .low
    }
}

// MARK: - BackupData
struct BackupData: Codable {
    var version: Int = 1
    var exportDate: String
    var profile: UserProfile
    var jurisdictions: [Jurisdiction]
    var entries: [LocationEntry]
    var documents: [Document]
}

// MARK: - Default Jurisdictions
extension Jurisdiction {
    static var defaults: [Jurisdiction] {
        let palette = [
            "#0A84FF", "#30D158", "#FF9F0A", "#FF453A",
            "#BF5AF2", "#FF6B6B", "#4ECDC4", "#45B7D1",
            "#FFA07A", "#98D8C8"
        ]
        let data: [(String, String, JurisdictionType, Int, String)] = [
            ("new_york", "New York", .state, 183, "183-day rule"),
            ("california", "California", .state, 183, "183-day rule"),
            ("new_jersey", "New Jersey", .state, 183, "183-day rule"),
            ("illinois", "Illinois", .state, 183, "183-day rule"),
            ("massachusetts", "Massachusetts", .state, 183, "183-day rule"),
            ("pennsylvania", "Pennsylvania", .state, 183, "183-day rule"),
            ("connecticut", "Connecticut", .state, 183, "183-day rule"),
            ("florida", "Florida", .state, 366, "No income tax"),
            ("texas", "Texas", .state, 366, "No income tax"),
            ("nevada", "Nevada", .state, 366, "No income tax"),
            ("washington_state", "Washington", .state, 366, "No income tax"),
            ("puerto_rico", "Puerto Rico", .territory, 183, "Act 60 - 183-day rule"),
            ("us_federal", "US Federal", .country, 183, "Substantial Presence Test"),
            ("united_kingdom", "United Kingdom", .country, 183, "Statutory Residence Test"),
        ]
        return data.enumerated().map { index, item in
            Jurisdiction(
                id: item.0,
                name: item.1,
                type: item.2,
                color: palette[index % palette.count],
                dayLimit: item.3,
                taxRule: item.4,
                isTracked: index < 5,
                isPrimary: false
            )
        }
    }
}
