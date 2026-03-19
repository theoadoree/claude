import Foundation
import SwiftUI
import Combine

// MARK: - Storage Keys
private enum StorageKeys {
    static let profile = "taxtrack_profile"
    static let jurisdictions = "taxtrack_jurisdictions"
    static let entries = "taxtrack_entries"
    static let documents = "taxtrack_documents"
}

// MARK: - DataStore
@MainActor
final class DataStore: ObservableObject {
    // MARK: - Published State
    @Published var profile: UserProfile = .default
    @Published var jurisdictions: [Jurisdiction] = []
    @Published var entries: [LocationEntry] = []
    @Published var documents: [Document] = []

    // MARK: - Computed Published
    @Published var yearSummary: YearSummary = .empty(year: Calendar.current.component(.year, from: Date()))
    @Published var auditRisk: AuditRisk = .empty
    @Published var insights: [TaxPlanningInsight] = []
    @Published var jurisdictionStats: [JurisdictionStats] = []
    @Published var selectedYear: Int = Calendar.current.component(.year, from: Date())

    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    // MARK: - Init
    init() {
        loadAll()
        if jurisdictions.isEmpty {
            jurisdictions = Jurisdiction.defaults
            saveJurisdictions()
        }
        refreshComputed()
    }

    // MARK: - Load
    private func loadAll() {
        if let data = UserDefaults.standard.data(forKey: StorageKeys.profile),
           let decoded = try? decoder.decode(UserProfile.self, from: data) {
            profile = decoded
        }
        if let data = UserDefaults.standard.data(forKey: StorageKeys.jurisdictions),
           let decoded = try? decoder.decode([Jurisdiction].self, from: data) {
            jurisdictions = decoded
        }
        if let data = UserDefaults.standard.data(forKey: StorageKeys.entries),
           let decoded = try? decoder.decode([LocationEntry].self, from: data) {
            entries = decoded
        }
        if let data = UserDefaults.standard.data(forKey: StorageKeys.documents),
           let decoded = try? decoder.decode([Document].self, from: data) {
            documents = decoded
        }
    }

    // MARK: - Save
    private func saveProfile() {
        if let data = try? encoder.encode(profile) {
            UserDefaults.standard.set(data, forKey: StorageKeys.profile)
        }
    }

    private func saveJurisdictions() {
        if let data = try? encoder.encode(jurisdictions) {
            UserDefaults.standard.set(data, forKey: StorageKeys.jurisdictions)
        }
    }

    private func saveEntries() {
        if let data = try? encoder.encode(entries) {
            UserDefaults.standard.set(data, forKey: StorageKeys.entries)
        }
    }

    private func saveDocuments() {
        if let data = try? encoder.encode(documents) {
            UserDefaults.standard.set(data, forKey: StorageKeys.documents)
        }
    }

    // MARK: - Profile
    func updateProfile(_ updated: UserProfile) {
        profile = updated
        saveProfile()
        refreshComputed()
    }

    // MARK: - Jurisdiction Management
    func addJurisdiction(_ jurisdiction: Jurisdiction) {
        jurisdictions.append(jurisdiction)
        saveJurisdictions()
        refreshComputed()
    }

    func updateJurisdiction(_ updated: Jurisdiction) {
        if let index = jurisdictions.firstIndex(where: { $0.id == updated.id }) {
            jurisdictions[index] = updated
            saveJurisdictions()
            refreshComputed()
        }
    }

    func removeJurisdiction(id: String) {
        jurisdictions.removeAll { $0.id == id }
        saveJurisdictions()
        refreshComputed()
    }

    func setPrimaryJurisdiction(id: String) {
        for i in jurisdictions.indices {
            jurisdictions[i].isPrimary = (jurisdictions[i].id == id)
        }
        profile.primaryJurisdictionId = id
        saveJurisdictions()
        saveProfile()
        refreshComputed()
    }

    // MARK: - Location Entry Management
    func addLocationEntry(_ entry: LocationEntry) {
        // One entry per day — update if date already exists
        if let existingIndex = entries.firstIndex(where: { $0.date == entry.date && $0.source == .auto && entry.source == .auto }) {
            entries[existingIndex] = entry
        } else {
            entries.append(entry)
        }
        entries.sort { $0.date > $1.date }
        saveEntries()
        refreshComputed()
    }

    func updateLocationEntry(_ updated: LocationEntry) {
        if let index = entries.firstIndex(where: { $0.id == updated.id }) {
            entries[index] = updated
            saveEntries()
            refreshComputed()
        }
    }

    func removeLocationEntry(id: String) {
        entries.removeAll { $0.id == id }
        saveEntries()
        refreshComputed()
    }

    func importEntries(_ newEntries: [LocationEntry]) {
        for entry in newEntries {
            // Avoid duplicates by date + jurisdiction
            if !entries.contains(where: { $0.date == entry.date && $0.jurisdictionId == entry.jurisdictionId }) {
                entries.append(entry)
            }
        }
        entries.sort { $0.date > $1.date }
        saveEntries()
        refreshComputed()
    }

    // MARK: - Document Management
    func addDocument(_ document: Document) {
        documents.append(document)
        saveDocuments()
    }

    func removeDocument(id: String) {
        documents.removeAll { $0.id == id }
        // Also remove from entry references
        for i in entries.indices {
            entries[i].documentIds.removeAll { $0 == id }
        }
        saveDocuments()
        saveEntries()
    }

    func attachDocument(documentId: String, toEntry entryId: String) {
        if let index = entries.firstIndex(where: { $0.id == entryId }) {
            if !entries[index].documentIds.contains(documentId) {
                entries[index].documentIds.append(documentId)
                saveEntries()
            }
        }
    }

    // MARK: - Year Selection
    func setSelectedYear(_ year: Int) {
        selectedYear = year
        refreshComputed()
    }

    // MARK: - Clear All
    func clearAll() {
        entries = []
        documents = []
        profile = .default
        jurisdictions = Jurisdiction.defaults
        saveProfile()
        saveJurisdictions()
        saveEntries()
        saveDocuments()
        refreshComputed()
    }

    // MARK: - Export Backup
    func exportBackup() -> Data? {
        let formatter = ISO8601DateFormatter()
        let backup = BackupData(
            version: 1,
            exportDate: formatter.string(from: Date()),
            profile: profile,
            jurisdictions: jurisdictions,
            entries: entries,
            documents: documents
        )
        let enc = JSONEncoder()
        enc.outputFormatting = .prettyPrinted
        return try? enc.encode(backup)
    }

    // MARK: - Import Backup
    @discardableResult
    func importBackup(from data: Data) -> Bool {
        guard let backup = try? decoder.decode(BackupData.self, from: data) else {
            return false
        }
        profile = backup.profile
        jurisdictions = backup.jurisdictions
        entries = backup.entries
        documents = backup.documents
        saveProfile()
        saveJurisdictions()
        saveEntries()
        saveDocuments()
        refreshComputed()
        return true
    }

    // MARK: - Import CSV (Monaeo-compatible)
    func importCSV(_ csvString: String) {
        let lines = csvString.components(separatedBy: "\n").filter { !$0.isEmpty }
        guard lines.count > 1 else { return }

        var imported: [LocationEntry] = []
        for line in lines.dropFirst() {
            let fields = parseCSVLine(line)
            guard fields.count >= 4 else { continue }
            // Expected: date, city, state/country, jurisdiction_id (or name)
            let dateStr = fields[0].trimmingCharacters(in: .whitespaces)
            let city = fields.count > 1 ? fields[1].trimmingCharacters(in: .whitespaces) : ""
            let stateName = fields.count > 2 ? fields[2].trimmingCharacters(in: .whitespaces) : ""
            let countryName = fields.count > 3 ? fields[3].trimmingCharacters(in: .whitespaces) : ""

            // Try to match jurisdiction by name
            let jId = matchJurisdiction(city: city, state: stateName, country: countryName)

            let entry = LocationEntry(
                date: dateStr,
                jurisdictionId: jId,
                city: city,
                state: stateName,
                country: countryName,
                source: .imported
            )
            imported.append(entry)
        }
        importEntries(imported)
    }

    private func parseCSVLine(_ line: String) -> [String] {
        var fields: [String] = []
        var current = ""
        var inQuotes = false
        for char in line {
            if char == "\"" {
                inQuotes.toggle()
            } else if char == "," && !inQuotes {
                fields.append(current)
                current = ""
            } else {
                current.append(char)
            }
        }
        fields.append(current)
        return fields
    }

    private func matchJurisdiction(city: String, state: String, country: String) -> String {
        let searchTerms = [state.lowercased(), city.lowercased(), country.lowercased()]
        for term in searchTerms {
            if let match = jurisdictions.first(where: { $0.name.lowercased().contains(term) || term.contains($0.name.lowercased()) }) {
                return match.id
            }
        }
        // Try abbreviations
        let stateAbbreviations: [String: String] = [
            "ny": "new_york", "ca": "california", "fl": "florida", "tx": "texas",
            "nj": "new_jersey", "il": "illinois", "ma": "massachusetts",
            "pa": "pennsylvania", "ct": "connecticut", "nv": "nevada",
            "wa": "washington_state", "pr": "puerto_rico"
        ]
        if let id = stateAbbreviations[state.lowercased()] {
            return id
        }
        return jurisdictions.first?.id ?? "unknown"
    }

    // MARK: - Refresh Computed
    func refreshComputed() {
        let stats = TaxCalculationService.calculateJurisdictionStats(
            entries: entries,
            jurisdictions: jurisdictions,
            year: selectedYear
        )
        jurisdictionStats = stats

        let yearEntries = entries.filter {
            $0.date.hasPrefix("\(selectedYear)")
        }

        let cal = Calendar.current
        var comps = DateComponents()
        comps.year = selectedYear
        let totalDaysInYear: Int
        if let date = cal.date(from: comps) {
            totalDaysInYear = cal.range(of: .day, in: .year, for: date)?.count ?? 365
        } else {
            totalDaysInYear = 365
        }

        let uniqueDates = Set(yearEntries.map { $0.date })
        let trackedDays = uniqueDates.count

        let breakdowns = stats.map { s in
            JurisdictionBreakdown(
                jurisdictionId: s.jurisdictionId,
                days: s.daysSpent,
                percentage: Double(s.daysSpent) / Double(max(totalDaysInYear, 1)) * 100
            )
        }

        yearSummary = YearSummary(
            year: selectedYear,
            totalDays: totalDaysInYear,
            trackedDays: trackedDays,
            missingDays: totalDaysInYear - trackedDays,
            jurisdictionBreakdowns: breakdowns
        )

        auditRisk = TaxCalculationService.calculateAuditRisk(
            stats: stats,
            yearSummary: yearSummary
        )

        insights = TaxCalculationService.generateInsights(
            stats: stats,
            jurisdictions: jurisdictions,
            profile: profile,
            yearSummary: yearSummary
        )
    }

    // MARK: - Helpers
    func jurisdiction(for id: String) -> Jurisdiction? {
        jurisdictions.first { $0.id == id }
    }

    func entries(for date: String) -> [LocationEntry] {
        entries.filter { $0.date == date }
    }

    func entries(for jurisdictionId: String, year: Int) -> [LocationEntry] {
        entries.filter { $0.jurisdictionId == jurisdictionId && $0.date.hasPrefix("\(year)") }
    }

    func availableYears() -> [Int] {
        let years = Set(entries.compactMap { entry -> Int? in
            Int(entry.date.prefix(4))
        })
        let current = Calendar.current.component(.year, from: Date())
        var result = Array(years)
        if !result.contains(current) { result.append(current) }
        return result.sorted(by: >)
    }
}
