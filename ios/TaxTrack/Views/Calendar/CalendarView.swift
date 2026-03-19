import SwiftUI

// MARK: - CalendarView
struct CalendarView: View {
    @EnvironmentObject var store: DataStore
    @State private var displayedMonth: Date = {
        let cal = Calendar.current
        let now = Date()
        return cal.date(from: cal.dateComponents([.year, .month], from: now)) ?? now
    }()
    @State private var selectedDate: String?
    @State private var showingAddEntry = false
    @State private var showingDayDetail = false

    private var calendar: Calendar { Calendar.current }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Month Navigation
                    MonthNavigationHeader(displayedMonth: $displayedMonth)
                        .padding(.horizontal, 16)
                        .padding(.top, 8)

                    // Day of week headers
                    DayOfWeekRow()
                        .padding(.horizontal, 16)
                        .padding(.top, 12)

                    // Calendar Grid
                    CalendarGrid(
                        displayedMonth: displayedMonth,
                        selectedDate: $selectedDate,
                        onDayTap: { dateStr in
                            selectedDate = dateStr
                            showingDayDetail = true
                        }
                    )
                    .padding(.horizontal, 16)
                    .padding(.top, 4)

                    // Legend
                    JurisdictionLegend()
                        .padding(.horizontal, 16)
                        .padding(.top, 12)

                    Spacer()
                }
            }
            .navigationTitle("Calendar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        let f = DateFormatter()
                        f.dateFormat = "yyyy-MM-dd"
                        selectedDate = f.string(from: Date())
                        showingAddEntry = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundColor(AppColors.primary)
                    }
                }
            }
            .sheet(isPresented: $showingAddEntry) {
                if let dateStr = selectedDate {
                    AddLocationView(date: dateStr)
                }
            }
            .sheet(isPresented: $showingDayDetail) {
                if let dateStr = selectedDate {
                    DayDetailSheet(date: dateStr, showingAddEntry: $showingAddEntry)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

// MARK: - Month Navigation Header
struct MonthNavigationHeader: View {
    @Binding var displayedMonth: Date

    private var calendar: Calendar { Calendar.current }

    var body: some View {
        HStack {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    displayedMonth = calendar.date(byAdding: .month, value: -1, to: displayedMonth) ?? displayedMonth
                }
            } label: {
                Image(systemName: "chevron.left")
                    .foregroundColor(AppColors.primary)
                    .frame(width: 40, height: 40)
            }

            Spacer()

            Text(monthYearString(displayedMonth))
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(.white)

            Spacer()

            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    displayedMonth = calendar.date(byAdding: .month, value: 1, to: displayedMonth) ?? displayedMonth
                }
            } label: {
                Image(systemName: "chevron.right")
                    .foregroundColor(AppColors.primary)
                    .frame(width: 40, height: 40)
            }
        }
    }

    private func monthYearString(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "MMMM yyyy"
        return f.string(from: date)
    }
}

// MARK: - Day of Week Row
struct DayOfWeekRow: View {
    private let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    var body: some View {
        HStack(spacing: 0) {
            ForEach(days, id: \.self) { day in
                Text(day)
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
            }
        }
    }
}

// MARK: - Calendar Grid
struct CalendarGrid: View {
    @EnvironmentObject var store: DataStore
    let displayedMonth: Date
    @Binding var selectedDate: String?
    let onDayTap: (String) -> Void

    private var calendar: Calendar { Calendar.current }

    private var daysInGrid: [Date?] {
        guard let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: displayedMonth)),
              let monthRange = calendar.range(of: .day, in: .month, for: monthStart) else {
            return []
        }
        let firstWeekday = calendar.component(.weekday, from: monthStart)
        let leadingBlanks = firstWeekday - 1

        var days: [Date?] = Array(repeating: nil, count: leadingBlanks)
        for day in monthRange {
            if let date = calendar.date(byAdding: .day, value: day - 1, to: monthStart) {
                days.append(date)
            }
        }
        // Pad to complete grid
        while days.count % 7 != 0 {
            days.append(nil)
        }
        return days
    }

    private var entriesByDate: [String: LocationEntry] {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        var dict: [String: LocationEntry] = [:]
        for entry in store.entries {
            dict[entry.date] = entry
        }
        return dict
    }

    var body: some View {
        let rows = daysInGrid.chunked(into: 7)
        let entryMap = entriesByDate

        LazyVStack(spacing: 4) {
            ForEach(rows.indices, id: \.self) { rowIdx in
                HStack(spacing: 4) {
                    ForEach(0..<7, id: \.self) { colIdx in
                        let date = rows[rowIdx][safe: colIdx] ?? nil
                        CalendarDayCell(
                            date: date,
                            entry: date.flatMap { entryMap[dateString($0)] },
                            selectedDate: selectedDate,
                            onTap: {
                                if let d = date {
                                    onDayTap(dateString(d))
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    private func dateString(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }
}

// MARK: - Calendar Day Cell
struct CalendarDayCell: View {
    @EnvironmentObject var store: DataStore
    let date: Date?
    let entry: LocationEntry?
    let selectedDate: String?
    let onTap: () -> Void

    private var calendar: Calendar { Calendar.current }
    private var isToday: Bool {
        guard let d = date else { return false }
        return calendar.isDateInToday(d)
    }
    private var dayNumber: String {
        guard let d = date else { return "" }
        return "\(calendar.component(.day, from: d))"
    }
    private var dateStr: String {
        guard let d = date else { return "" }
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: d)
    }
    private var isSelected: Bool { selectedDate == dateStr && !dateStr.isEmpty }

    private var jurisdictionColor: Color? {
        guard let entry = entry,
              let jurisdiction = store.jurisdiction(for: entry.jurisdictionId) else {
            return nil
        }
        return Color(hex: jurisdiction.color)
    }

    var body: some View {
        Button(action: onTap) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(backgroundColor)

                VStack(spacing: 2) {
                    Text(dayNumber)
                        .font(.system(size: 14, weight: isToday ? .bold : .regular))
                        .foregroundColor(foregroundColor)

                    if jurisdictionColor != nil {
                        Circle()
                            .fill(jurisdictionColor!)
                            .frame(width: 5, height: 5)
                    } else {
                        Circle()
                            .fill(Color.clear)
                            .frame(width: 5, height: 5)
                    }
                }
                .padding(.vertical, 4)

                if isToday {
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(AppColors.primary, lineWidth: 1.5)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .aspectRatio(1, contentMode: .fit)
        .disabled(date == nil)
    }

    private var backgroundColor: Color {
        guard date != nil else { return Color.clear }
        if isSelected { return AppColors.primary.opacity(0.3) }
        if let jc = jurisdictionColor { return jc.opacity(0.12) }
        return AppColors.surface.opacity(0.5)
    }

    private var foregroundColor: Color {
        guard date != nil else { return Color.clear }
        if isToday { return AppColors.primary }
        return .white
    }
}

// MARK: - Day Detail Sheet
struct DayDetailSheet: View {
    @EnvironmentObject var store: DataStore
    let date: String
    @Binding var showingAddEntry: Bool
    @Environment(\.dismiss) var dismiss

    private var entries: [LocationEntry] { store.entries(for: date) }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    if entries.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "calendar.badge.minus")
                                .font(.system(size: 48))
                                .foregroundColor(.secondary)
                            Text("No entry for \(formatDate(date))")
                                .font(.headline)
                                .foregroundColor(.white)
                            Text("Add a location entry to track this day")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            Button {
                                dismiss()
                                showingAddEntry = true
                            } label: {
                                Label("Add Entry", systemImage: "plus.circle.fill")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .padding()
                                    .frame(maxWidth: .infinity)
                                    .background(AppColors.primary)
                                    .cornerRadius(14)
                                    .padding(.horizontal, 32)
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        ScrollView {
                            VStack(spacing: 12) {
                                ForEach(entries) { entry in
                                    DayEntryCard(entry: entry)
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .navigationTitle(formatDate(date))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundColor(AppColors.primary)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        dismiss()
                        showingAddEntry = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundColor(AppColors.primary)
                    }
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func formatDate(_ str: String) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        if let d = f.date(from: str) {
            f.dateFormat = "EEEE, MMM d"
            return f.string(from: d)
        }
        return str
    }
}

struct DayEntryCard: View {
    @EnvironmentObject var store: DataStore
    let entry: LocationEntry

    private var jurisdiction: Jurisdiction? { store.jurisdiction(for: entry.jurisdictionId) }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                if let j = jurisdiction {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color(hex: j.color))
                            .frame(width: 12, height: 12)
                        Text(j.name)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                    }
                }
                Spacer()
                if entry.isVerified {
                    Image(systemName: "checkmark.shield.fill")
                        .foregroundColor(AppColors.secondary)
                }
                SourceBadge(source: entry.source)
            }

            if !entry.locationDescription.isEmpty {
                Label(entry.locationDescription, systemImage: "location.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            HStack {
                Label(entry.activityType.displayName, systemImage: entry.activityType.icon)
                    .font(.caption)
                    .foregroundColor(.secondary)
                if !entry.notes.isEmpty {
                    Text("•")
                        .foregroundColor(.secondary)
                    Text(entry.notes)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .padding(14)
        .background(AppColors.surface)
        .cornerRadius(12)
    }
}

// MARK: - Jurisdiction Legend
struct JurisdictionLegend: View {
    @EnvironmentObject var store: DataStore

    private var trackedJurisdictions: [Jurisdiction] {
        store.jurisdictions.filter { $0.isTracked }
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(trackedJurisdictions) { j in
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color(hex: j.color))
                            .frame(width: 10, height: 10)
                        Text(j.name)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }
}

// MARK: - Array chunked extension
extension Array {
    func chunked(into size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}
