import SwiftUI

// MARK: - DashboardView
struct DashboardView: View {
    @EnvironmentObject var store: DataStore
    @EnvironmentObject var locationService: LocationService
    @State private var showingAddEntry = false
    @State private var showingDocuments = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Year Picker
                        YearPickerView()

                        // Days Overview Card
                        DaysOverviewCard()

                        // Audit Risk Gauge
                        AuditRiskCard()

                        // Jurisdiction Cards
                        JurisdictionSection()

                        // Quick Actions
                        QuickActionsSection(
                            showingAddEntry: $showingAddEntry,
                            showingDocuments: $showingDocuments
                        )

                        Spacer(minLength: 32)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                }
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(locationService.isTracking ? AppColors.secondary : Color.gray)
                            .frame(width: 8, height: 8)
                        Text(locationService.isTracking ? "Tracking" : "Paused")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .sheet(isPresented: $showingAddEntry) {
                AddLocationView(date: todayString())
            }
            .sheet(isPresented: $showingDocuments) {
                DocumentsView()
            }
        }
        .preferredColorScheme(.dark)
    }

    private func todayString() -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }
}

// MARK: - Year Picker
struct YearPickerView: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        HStack {
            Text("Tax Year")
                .font(.headline)
                .foregroundColor(.white)
            Spacer()
            Menu {
                ForEach(store.availableYears(), id: \.self) { year in
                    Button("\(year)") {
                        store.setSelectedYear(year)
                    }
                }
            } label: {
                HStack(spacing: 6) {
                    Text("\(store.selectedYear)")
                        .font(.headline)
                        .foregroundColor(AppColors.primary)
                    Image(systemName: "chevron.down")
                        .font(.caption)
                        .foregroundColor(AppColors.primary)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(AppColors.primary.opacity(0.15))
                .cornerRadius(10)
            }
        }
        .padding(.horizontal, 4)
    }
}

// MARK: - Days Overview Card
struct DaysOverviewCard: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        let summary = store.yearSummary
        VStack(spacing: 0) {
            HStack {
                Text("Year Overview")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                Spacer()
            }
            .padding(.bottom, 14)

            HStack(spacing: 0) {
                OverviewStat(
                    value: "\(summary.totalDays)",
                    label: "Total Days",
                    color: .white
                )
                Divider()
                    .frame(height: 44)
                    .background(Color.gray.opacity(0.3))
                OverviewStat(
                    value: "\(summary.trackedDays)",
                    label: "Tracked",
                    color: AppColors.secondary
                )
                Divider()
                    .frame(height: 44)
                    .background(Color.gray.opacity(0.3))
                OverviewStat(
                    value: "\(summary.missingDays)",
                    label: "Missing",
                    color: summary.missingDays > 30 ? AppColors.riskHigh : AppColors.accent
                )
            }

            // Progress bar
            let trackedRatio = summary.totalDays > 0
                ? Double(summary.trackedDays) / Double(summary.totalDays)
                : 0
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(AppColors.primary)
                        .frame(width: geo.size.width * trackedRatio, height: 6)
                }
            }
            .frame(height: 6)
            .padding(.top, 16)

            Text("\(Int(trackedRatio * 100))% of \(summary.year) tracked")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .padding(.top, 4)
        }
        .padding(18)
        .background(AppColors.surface)
        .cornerRadius(16)
    }
}

struct OverviewStat: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Audit Risk Card
struct AuditRiskCard: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        let risk = store.auditRisk
        VStack(spacing: 16) {
            HStack {
                Text("Audit Risk Score")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                Spacer()
                HStack(spacing: 6) {
                    Image(systemName: risk.level.icon)
                    Text(risk.level.displayName)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                .foregroundColor(risk.level.color)
            }

            // Gauge
            RiskGauge(score: risk.score, level: risk.level)
                .frame(height: 120)

            // Top factors
            if !risk.factors.isEmpty {
                VStack(spacing: 6) {
                    ForEach(risk.factors.prefix(3)) { factor in
                        HStack(spacing: 10) {
                            Image(systemName: factor.isPositive ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                                .foregroundColor(factor.isPositive ? AppColors.secondary : AppColors.riskHigh)
                                .font(.caption)
                            Text(factor.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                            Spacer()
                        }
                    }
                }
            }
        }
        .padding(18)
        .background(AppColors.surface)
        .cornerRadius(16)
    }
}

// MARK: - Risk Gauge (Canvas)
struct RiskGauge: View {
    let score: Int
    let level: RiskLevel

    var body: some View {
        Canvas { context, size in
            let center = CGPoint(x: size.width / 2, y: size.height * 0.85)
            let radius = min(size.width, size.height) * 0.75
            let startAngle = Angle(degrees: 180)
            let endAngle = Angle(degrees: 360)

            // Background arc
            var bgPath = Path()
            bgPath.addArc(center: center, radius: radius,
                          startAngle: startAngle, endAngle: endAngle,
                          clockwise: false)
            context.stroke(bgPath, with: .color(.gray.opacity(0.25)), style: StrokeStyle(lineWidth: 16, lineCap: .round))

            // Colored arc segments
            let segments: [(Color, Double, Double)] = [
                (Color(hex: "#8E2929"), 0, 0.30),
                (Color(hex: "#FF453A"), 0.30, 0.59),
                (Color(hex: "#FF9F0A"), 0.59, 0.79),
                (Color(hex: "#30D158"), 0.79, 1.0)
            ]
            for seg in segments {
                let segStart = Angle(degrees: 180 + 180 * seg.1)
                let segEnd = Angle(degrees: 180 + 180 * seg.2)
                var segPath = Path()
                segPath.addArc(center: center, radius: radius,
                               startAngle: segStart, endAngle: segEnd,
                               clockwise: false)
                context.stroke(segPath, with: .color(seg.0.opacity(0.3)),
                               style: StrokeStyle(lineWidth: 16, lineCap: .butt))
            }

            // Score arc
            let scoreRatio = Double(score) / 100.0
            let scoreEndAngle = Angle(degrees: 180 + 180 * scoreRatio)
            var scorePath = Path()
            scorePath.addArc(center: center, radius: radius,
                             startAngle: startAngle, endAngle: scoreEndAngle,
                             clockwise: false)
            context.stroke(scorePath, with: .color(level.color),
                           style: StrokeStyle(lineWidth: 16, lineCap: .round))

            // Needle
            let needleAngle = 180.0 + 180.0 * scoreRatio
            let needleRad = needleAngle * Double.pi / 180
            let needleLength = radius - 10
            let needleEnd = CGPoint(
                x: center.x + needleLength * cos(needleRad),
                y: center.y + needleLength * sin(needleRad)
            )
            var needlePath = Path()
            needlePath.move(to: center)
            needlePath.addLine(to: needleEnd)
            context.stroke(needlePath, with: .color(.white.opacity(0.9)),
                           style: StrokeStyle(lineWidth: 3, lineCap: .round))

            // Center dot
            let dotRect = CGRect(x: center.x - 6, y: center.y - 6, width: 12, height: 12)
            context.fill(Path(ellipseIn: dotRect), with: .color(.white))
        }
        .overlay(alignment: .bottom) {
            VStack(spacing: 2) {
                Text("\(score)")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(level.color)
                Text("/ 100")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 8)
        }
    }
}

// MARK: - Jurisdiction Section
struct JurisdictionSection: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Jurisdictions")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                Spacer()
            }

            if store.jurisdictionStats.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "map")
                        .font(.title)
                        .foregroundColor(.secondary)
                    Text("No tracked jurisdictions")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(24)
                .background(AppColors.surface)
                .cornerRadius(16)
            } else {
                ForEach(store.jurisdictionStats) { stat in
                    NavigationLink(destination: JurisdictionDetailView(stat: stat)) {
                        JurisdictionCard(stat: stat)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
    }
}

struct JurisdictionCard: View {
    let stat: JurisdictionStats

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                HStack(spacing: 10) {
                    Circle()
                        .fill(Color(hex: stat.color))
                        .frame(width: 12, height: 12)
                    Text(stat.jurisdictionName)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    HStack(spacing: 2) {
                        Text("\(stat.daysSpent)")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(stat.riskLevel.color)
                        Text("/ \(stat.dayLimit)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Text("days")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(stat.riskLevel.color)
                        .frame(width: geo.size.width * stat.progressRatio, height: 6)
                }
            }
            .frame(height: 6)

            HStack {
                RiskBadge(level: stat.riskLevel)
                Spacer()
                Text("\(Int(stat.progressRatio * 100))% of limit")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(16)
        .background(AppColors.surface)
        .cornerRadius(16)
    }
}

struct RiskBadge: View {
    let level: RiskLevel

    var body: some View {
        Text(level.displayName)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundColor(level.color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(level.color.opacity(0.15))
            .cornerRadius(6)
    }
}

// MARK: - Quick Actions Section
struct QuickActionsSection: View {
    @Binding var showingAddEntry: Bool
    @Binding var showingDocuments: Bool

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Quick Actions")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                Spacer()
            }

            HStack(spacing: 12) {
                QuickActionButton(
                    icon: "plus.circle.fill",
                    title: "Add Day",
                    color: AppColors.primary
                ) {
                    showingAddEntry = true
                }
                QuickActionButton(
                    icon: "doc.fill",
                    title: "Documents",
                    color: AppColors.accent
                ) {
                    showingDocuments = true
                }
            }
        }
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 26))
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .padding(16)
            .background(AppColors.surface)
            .cornerRadius(14)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
