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
                        YearPickerView()
                        DaysOverviewCard()
                        AuditRiskCard()
                        JurisdictionSection()
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
                    TrackingStatusBadge()
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

// MARK: - Tracking Status Badge
struct TrackingStatusBadge: View {
    @EnvironmentObject var locationService: LocationService
    @State private var pulsing = false

    var body: some View {
        HStack(spacing: 5) {
            ZStack {
                if locationService.isTracking {
                    Circle()
                        .fill(AppColors.secondary.opacity(0.3))
                        .frame(width: 14, height: 14)
                        .scaleEffect(pulsing ? 1.6 : 1.0)
                        .opacity(pulsing ? 0 : 0.6)
                        .animation(.easeOut(duration: 1.4).repeatForever(autoreverses: false), value: pulsing)
                }
                Circle()
                    .fill(locationService.isTracking ? AppColors.secondary : Color.gray.opacity(0.5))
                    .frame(width: 8, height: 8)
            }
            Text(locationService.isTracking ? "Live" : "Paused")
                .font(.caption)
                .foregroundColor(locationService.isTracking ? AppColors.secondary : .secondary)
        }
        .onAppear { pulsing = true }
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
        let trackedRatio = summary.totalDays > 0
            ? Double(summary.trackedDays) / Double(summary.totalDays)
            : 0

        VStack(spacing: 0) {
            HStack {
                Text("Year Overview")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(Int(trackedRatio * 100))% tracked")
                    .font(.caption)
                    .foregroundColor(.secondary)
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

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.15))
                        .frame(height: 7)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(
                                colors: [AppColors.primary, AppColors.secondary],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * trackedRatio, height: 7)
                        .animation(.spring(response: 0.6), value: trackedRatio)
                }
            }
            .frame(height: 7)
            .padding(.top, 16)
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
                .contentTransition(.numericText())
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
                HStack(spacing: 5) {
                    Image(systemName: risk.level.icon)
                        .font(.caption)
                    Text(risk.level.displayName)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                .foregroundColor(risk.level.color)
            }

            RiskGauge(score: risk.score, level: risk.level)
                .frame(height: 120)

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

            var bgPath = Path()
            bgPath.addArc(center: center, radius: radius,
                          startAngle: startAngle, endAngle: endAngle,
                          clockwise: false)
            context.stroke(bgPath, with: .color(.gray.opacity(0.2)), style: StrokeStyle(lineWidth: 16, lineCap: .round))

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
                context.stroke(segPath, with: .color(seg.0.opacity(0.25)),
                               style: StrokeStyle(lineWidth: 16, lineCap: .butt))
            }

            let scoreRatio = Double(score) / 100.0
            let scoreEndAngle = Angle(degrees: 180 + 180 * scoreRatio)
            var scorePath = Path()
            scorePath.addArc(center: center, radius: radius,
                             startAngle: startAngle, endAngle: scoreEndAngle,
                             clockwise: false)
            context.stroke(scorePath, with: .color(level.color),
                           style: StrokeStyle(lineWidth: 16, lineCap: .round))

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
                           style: StrokeStyle(lineWidth: 2.5, lineCap: .round))

            let dotRect = CGRect(x: center.x - 5, y: center.y - 5, width: 10, height: 10)
            context.fill(Path(ellipseIn: dotRect), with: .color(.white))
        }
        .overlay(alignment: .bottom) {
            VStack(spacing: 2) {
                Text("\(score)")
                    .font(.system(size: 34, weight: .bold))
                    .foregroundColor(level.color)
                    .contentTransition(.numericText())
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
                if !store.jurisdictionStats.isEmpty {
                    Text("\(store.jurisdictionStats.count) tracked")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
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
        HStack(spacing: 0) {
            // Left color accent bar
            RoundedRectangle(cornerRadius: 3)
                .fill(Color(hex: stat.color))
                .frame(width: 4)
                .padding(.vertical, 2)

            VStack(spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(stat.jurisdictionName)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                        RiskBadge(level: stat.riskLevel)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        HStack(alignment: .firstTextBaseline, spacing: 3) {
                            Text("\(stat.daysSpent)")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(stat.riskLevel.color)
                                .contentTransition(.numericText())
                            Text("/ \(stat.dayLimit)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        Text("days spent")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.gray.opacity(0.15))
                            .frame(height: 6)
                        // Warning zone overlay (85–100% range)
                        let warnStart = min(0.85 * geo.size.width, geo.size.width)
                        RoundedRectangle(cornerRadius: 4)
                            .fill(AppColors.riskHigh.opacity(0.12))
                            .frame(width: geo.size.width - warnStart, height: 6)
                            .offset(x: warnStart)
                        RoundedRectangle(cornerRadius: 4)
                            .fill(stat.riskLevel.color)
                            .frame(width: min(geo.size.width * stat.progressRatio, geo.size.width), height: 6)
                            .animation(.spring(response: 0.5), value: stat.progressRatio)
                    }
                }
                .frame(height: 6)

                HStack {
                    Text("\(Int(stat.progressRatio * 100))% of limit")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption2)
                        .foregroundColor(Color.gray.opacity(0.5))
                }
            }
            .padding(14)
        }
        .background(AppColors.surface)
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(stat.riskLevel == .critical ? AppColors.riskCritical.opacity(0.4) : Color.clear, lineWidth: 1)
        )
    }
}

struct RiskBadge: View {
    let level: RiskLevel

    var body: some View {
        Text(level.displayName)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundColor(level.color)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(level.color.opacity(0.15))
            .cornerRadius(5)
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
                    subtitle: "Log location",
                    color: AppColors.primary
                ) {
                    showingAddEntry = true
                }
                QuickActionButton(
                    icon: "doc.fill",
                    title: "Documents",
                    subtitle: "Evidence vault",
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
    let subtitle: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 26))
                    .foregroundColor(color)
                VStack(spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(16)
            .background(AppColors.surface)
            .cornerRadius(14)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
