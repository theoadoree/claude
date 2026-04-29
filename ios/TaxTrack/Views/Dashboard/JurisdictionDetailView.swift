import SwiftUI

// MARK: - JurisdictionDetailView
struct JurisdictionDetailView: View {
    @EnvironmentObject var store: DataStore
    let stat: JurisdictionStats

    @State private var selectedEntry: LocationEntry?
    @State private var showingEditEntry = false

    private var jurisdiction: Jurisdiction? {
        store.jurisdiction(for: stat.jurisdictionId)
    }

    private var yearEntries: [LocationEntry] {
        store.entries(for: stat.jurisdictionId, year: store.selectedYear)
            .sorted { $0.date > $1.date }
    }

    private var monthlyBreakdown: [(String, Int)] {
        let grouped = Dictionary(grouping: yearEntries) { entry -> String in
            String(entry.date.prefix(7)) // YYYY-MM
        }
        return grouped.map { (month, entries) in
            (month, Set(entries.map { $0.date }).count)
        }.sorted { $0.0 > $1.0 }
    }

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    // Header Card
                    headerCard

                    // Monthly Breakdown
                    monthlyBreakdownSection

                    // All Entries
                    allEntriesSection

                    Spacer(minLength: 32)
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
            }
        }
        .navigationTitle(stat.jurisdictionName)
        .navigationBarTitleDisplayMode(.large)
        .sheet(item: $selectedEntry) { entry in
            AddLocationView(existingEntry: entry)
        }
    }

    // MARK: - Header Card
    private var headerCard: some View {
        VStack(spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color(hex: stat.color))
                            .frame(width: 16, height: 16)
                        Text(jurisdiction?.type.displayName ?? "")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Text(jurisdiction?.taxRule ?? "")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()
                RiskBadge(level: stat.riskLevel)
            }

            // Big day count
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(stat.daysSpent)")
                    .font(.system(size: 52, weight: .bold))
                    .foregroundColor(stat.riskLevel.color)
                    .contentTransition(.numericText())
                Text("/ \(stat.dayLimit) days")
                    .font(.title3)
                    .foregroundColor(.secondary)
                Spacer()
            }

            // Progress bar with danger zone
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.gray.opacity(0.15))
                        .frame(height: 10)
                    // Danger zone (85–100%)
                    let dangerStart = min(0.85 * geo.size.width, geo.size.width)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(AppColors.riskHigh.opacity(0.15))
                        .frame(width: geo.size.width - dangerStart, height: 10)
                        .offset(x: dangerStart)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(stat.riskLevel.color)
                        .frame(width: min(geo.size.width * stat.progressRatio, geo.size.width), height: 10)
                        .animation(.spring(response: 0.6), value: stat.progressRatio)
                }
            }
            .frame(height: 10)

            // Stats row
            HStack(spacing: 0) {
                DetailStat(label: "Remaining", value: "\(max(0, stat.dayLimit - stat.daysSpent))", color: AppColors.secondary)
                Divider().frame(height: 36).background(Color.gray.opacity(0.3))
                DetailStat(label: "Entries", value: "\(stat.entriesCount)", color: .white)
                Divider().frame(height: 36).background(Color.gray.opacity(0.3))
                DetailStat(label: "Verified", value: "\(stat.verifiedCount)", color: AppColors.accent)
            }
        }
        .padding(18)
        .background(AppColors.surface)
        .cornerRadius(16)
    }

    // MARK: - Monthly Breakdown
    private var monthlyBreakdownSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Monthly Breakdown")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)

            if monthlyBreakdown.isEmpty {
                Text("No data for \(store.selectedYear)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(16)
                    .frame(maxWidth: .infinity)
                    .background(AppColors.surface)
                    .cornerRadius(12)
            } else {
                VStack(spacing: 2) {
                    ForEach(monthlyBreakdown, id: \.0) { month, days in
                        HStack {
                            Text(formatMonth(month))
                                .font(.subheadline)
                                .foregroundColor(.white)
                                .frame(width: 80, alignment: .leading)
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color.gray.opacity(0.2))
                                        .frame(height: 8)
                                    let ratio = min(Double(days) / Double(max(stat.dayLimit, 30)), 1.0)
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color(hex: stat.color))
                                        .frame(width: geo.size.width * ratio, height: 8)
                                }
                            }
                            .frame(height: 8)
                            Text("\(days)d")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .frame(width: 32, alignment: .trailing)
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 14)
                        .background(AppColors.surface)
                        .cornerRadius(8)
                    }
                }
            }
        }
    }

    // MARK: - All Entries
    private var allEntriesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("All Entries (\(yearEntries.count))")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)

            if yearEntries.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "calendar.badge.minus")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text("No entries for \(store.selectedYear)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(24)
                .background(AppColors.surface)
                .cornerRadius(12)
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(yearEntries) { entry in
                        EntryRow(entry: entry)
                            .onTapGesture {
                                selectedEntry = entry
                            }
                    }
                }
            }
        }
    }

    private func formatMonth(_ yearMonth: String) -> String {
        let parts = yearMonth.split(separator: "-")
        guard parts.count == 2, let month = Int(parts[1]) else { return yearMonth }
        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return months[safe: month - 1] ?? yearMonth
    }
}

struct DetailStat: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct EntryRow: View {
    let entry: LocationEntry

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(formatDate(entry.date))
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                if !entry.locationDescription.isEmpty {
                    Text(entry.locationDescription)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                HStack(spacing: 4) {
                    Image(systemName: entry.activityType.icon)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(entry.activityType.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                HStack(spacing: 4) {
                    if entry.isVerified {
                        Image(systemName: "checkmark.shield.fill")
                            .font(.caption2)
                            .foregroundColor(AppColors.secondary)
                    }
                    SourceBadge(source: entry.source)
                }
            }
        }
        .padding(12)
        .background(AppColors.surface)
        .cornerRadius(10)
    }

    private func formatDate(_ dateStr: String) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        if let date = f.date(from: dateStr) {
            f.dateFormat = "MMM d, yyyy"
            return f.string(from: date)
        }
        return dateStr
    }
}

struct SourceBadge: View {
    let source: EntrySource

    var color: Color {
        switch source {
        case .auto: return AppColors.primary
        case .manual: return AppColors.accent
        case .imported: return Color(hex: "#BF5AF2")
        }
    }

    var body: some View {
        Text(source.displayName)
            .font(.caption2)
            .foregroundColor(color)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(color.opacity(0.15))
            .cornerRadius(5)
    }
}

// MARK: - Safe array subscript
extension Array {
    subscript(safe index: Int) -> Element? {
        guard index >= 0, index < count else { return nil }
        return self[index]
    }
}
