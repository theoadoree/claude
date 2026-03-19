import SwiftUI

// MARK: - PlanningView
struct PlanningView: View {
    @EnvironmentObject var store: DataStore
    @State private var selectedTab = 0

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Tab Picker
                    Picker("", selection: $selectedTab) {
                        Text("Insights").tag(0)
                        Text("Opportunities").tag(1)
                        Text("Risk Analysis").tag(2)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)

                    // Content
                    TabView(selection: $selectedTab) {
                        InsightsTab()
                            .tag(0)
                        OpportunitiesTab()
                            .tag(1)
                        RiskAnalysisTab()
                            .tag(2)
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))
                    .animation(.easeInOut, value: selectedTab)
                }
            }
            .navigationTitle("Tax Planning")
            .navigationBarTitleDisplayMode(.large)
        }
        .preferredColorScheme(.dark)
    }
}

// MARK: - Insights Tab
struct InsightsTab: View {
    @EnvironmentObject var store: DataStore

    private var groupedInsights: [(InsightPriority, [TaxPlanningInsight])] {
        let grouped = Dictionary(grouping: store.insights) { $0.priority }
        return grouped.sorted { $0.key < $1.key }
    }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                if store.insights.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 52))
                            .foregroundColor(AppColors.secondary)
                            .padding(.top, 40)
                        Text("All Clear!")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text("No tax planning insights at this time. Keep tracking your location to maintain compliance.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }
                } else {
                    ForEach(groupedInsights, id: \.0) { priority, insights in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(priority.displayName.uppercased())
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(priority.color)
                                    .tracking(1)
                                Spacer()
                                Text("\(insights.count)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            ForEach(insights) { insight in
                                InsightCard(insight: insight)
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
    }
}

struct InsightCard: View {
    let insight: TaxPlanningInsight
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(insight.type.color.opacity(0.15))
                        .frame(width: 36, height: 36)
                    Image(systemName: insight.type.icon)
                        .font(.system(size: 16))
                        .foregroundColor(insight.type.color)
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(insight.title)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer()
                        PriorityDot(priority: insight.priority)
                    }
                    Text(insight.type.displayName)
                        .font(.caption2)
                        .foregroundColor(insight.type.color)
                }
            }

            // Message
            Text(insight.message)
                .font(.caption)
                .foregroundColor(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            // Action items (expandable)
            if !insight.actionItems.isEmpty {
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        isExpanded.toggle()
                    }
                } label: {
                    HStack {
                        Text(isExpanded ? "Hide Actions" : "Show Actions (\(insight.actionItems.count))")
                            .font(.caption)
                            .foregroundColor(AppColors.primary)
                        Spacer()
                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.caption2)
                            .foregroundColor(AppColors.primary)
                    }
                }

                if isExpanded {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(insight.actionItems.indices, id: \.self) { i in
                            HStack(alignment: .top, spacing: 8) {
                                Text("\(i + 1).")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .frame(width: 16)
                                Text(insight.actionItems[i])
                                    .font(.caption)
                                    .foregroundColor(.white)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                    .padding(10)
                    .background(AppColors.background)
                    .cornerRadius(8)
                }
            }
        }
        .padding(14)
        .background(AppColors.surface)
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(insight.priority == .urgent ? AppColors.riskHigh.opacity(0.5) : Color.clear, lineWidth: 1)
        )
    }
}

struct PriorityDot: View {
    let priority: InsightPriority

    var body: some View {
        Circle()
            .fill(priority.color)
            .frame(width: 8, height: 8)
    }
}

// MARK: - Opportunities Tab
struct OpportunitiesTab: View {
    @EnvironmentObject var store: DataStore

    private let opportunities: [OpportunityItem] = [
        OpportunityItem(
            title: "Florida Domicile",
            subtitle: "No state income tax",
            description: "Florida has no state income tax. Establishing domicile requires 183+ days of presence and clear intent to remain.",
            icon: "sun.max.fill",
            color: Color(hex: "#FF9F0A"),
            requirements: ["183+ days in Florida", "Florida driver's license", "Florida voter registration", "Primary home in Florida", "Strong community ties"]
        ),
        OpportunityItem(
            title: "Texas Residency",
            subtitle: "No state income tax",
            description: "Texas has no state income tax. A strong domicile in Texas can protect against claims by high-tax states.",
            icon: "star.fill",
            color: Color(hex: "#FF9F0A"),
            requirements: ["183+ days in Texas", "Texas driver's license", "Homestead exemption", "Bank and financial accounts in Texas"]
        ),
        OpportunityItem(
            title: "Puerto Rico Act 60",
            subtitle: "4% corporate tax, 0% capital gains",
            description: "Puerto Rico's Act 60 offers dramatic tax savings for eligible individuals and businesses with a bona fide residency.",
            icon: "building.columns.fill",
            color: Color(hex: "#30D158"),
            requirements: ["183+ days in Puerto Rico", "Bona fide resident status", "Act 60 decree application", "Puerto Rico source income"]
        ),
        OpportunityItem(
            title: "Nevada LLC Structure",
            subtitle: "No income or franchise tax",
            description: "Nevada has no corporate income tax, franchise tax, or personal income tax, making it attractive for business structure.",
            icon: "building.2.fill",
            color: Color(hex: "#BF5AF2"),
            requirements: ["Nevada business registration", "Registered agent in Nevada", "Compliance with Nevada law"]
        ),
        OpportunityItem(
            title: "Washington State",
            subtitle: "No state income tax",
            description: "Washington State has no personal income tax. Combined with strong tech sector presence, it's a popular choice.",
            icon: "leaf.fill",
            color: Color(hex: "#45B7D1"),
            requirements: ["Washington State residency", "Washington driver's license", "Physical presence requirements"]
        ),
        OpportunityItem(
            title: "US Foreign Earned Income",
            subtitle: "Up to $126,500 exclusion (2024)",
            description: "US citizens living abroad can exclude up to $126,500 of foreign earned income if they pass the bona fide residence or physical presence test.",
            icon: "globe",
            color: Color(hex: "#0A84FF"),
            requirements: ["330 days outside the US OR", "Bona fide foreign resident status", "Foreign earned income", "File Form 2555"]
        )
    ]

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                Text("Tax-Friendly Jurisdictions")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 4)

                ForEach(opportunities) { opp in
                    OpportunityCard(item: opp)
                }
            }
            .padding(16)
        }
    }
}

struct OpportunityItem: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let description: String
    let icon: String
    let color: Color
    let requirements: [String]
}

struct OpportunityCard: View {
    let item: OpportunityItem
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(item.color.opacity(0.15))
                        .frame(width: 48, height: 48)
                    Image(systemName: item.icon)
                        .font(.system(size: 22))
                        .foregroundColor(item.color)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    Text(item.subtitle)
                        .font(.caption)
                        .foregroundColor(item.color)
                }
                Spacer()
                Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .contentShape(Rectangle())
            .onTapGesture {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isExpanded.toggle()
                }
            }

            if isExpanded {
                Text(item.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)

                VStack(alignment: .leading, spacing: 6) {
                    Text("Requirements")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                    ForEach(item.requirements, id: \.self) { req in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "checkmark.circle")
                                .font(.caption)
                                .foregroundColor(item.color)
                            Text(req)
                                .font(.caption)
                                .foregroundColor(.white)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                .padding(10)
                .background(AppColors.background)
                .cornerRadius(8)
            }
        }
        .padding(14)
        .background(AppColors.surface)
        .cornerRadius(14)
    }
}

// MARK: - Risk Analysis Tab
struct RiskAnalysisTab: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Overall Risk
                RiskSummaryCard()

                // Factors
                RiskFactorsCard()

                // Recommendations
                RecommendationsCard()

                // Jurisdiction Risk Bars
                JurisdictionRiskBars()
            }
            .padding(16)
        }
    }
}

struct RiskSummaryCard: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        let risk = store.auditRisk
        VStack(spacing: 16) {
            HStack {
                Text("Audit Risk Assessment")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(store.selectedYear)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            HStack(spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(risk.level.color.opacity(0.2), lineWidth: 8)
                        .frame(width: 80, height: 80)
                    Circle()
                        .trim(from: 0, to: CGFloat(risk.score) / 100)
                        .stroke(risk.level.color, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text("\(risk.score)")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(risk.level.color)
                        Text("/100")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: risk.level.icon)
                        Text("\(risk.level.displayName) Risk")
                            .font(.headline)
                    }
                    .foregroundColor(risk.level.color)

                    Text(riskDescription(risk.level))
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding(16)
        .background(AppColors.surface)
        .cornerRadius(14)
    }

    private func riskDescription(_ level: RiskLevel) -> String {
        switch level {
        case .low: return "Your tax position appears well-documented and compliant."
        case .moderate: return "Some areas need attention to maintain compliance."
        case .high: return "Significant compliance issues require immediate attention."
        case .critical: return "Critical compliance failures. Consult a tax professional now."
        }
    }
}

struct RiskFactorsCard: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        let risk = store.auditRisk
        VStack(alignment: .leading, spacing: 12) {
            Text("Risk Factors")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)

            if risk.factors.isEmpty {
                Text("No risk factors identified")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.vertical, 8)
            } else {
                ForEach(risk.factors) { factor in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: factor.isPositive ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                            .foregroundColor(factor.isPositive ? AppColors.secondary : AppColors.riskHigh)
                            .font(.subheadline)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(factor.description)
                                .font(.caption)
                                .foregroundColor(.white)
                                .fixedSize(horizontal: false, vertical: true)
                            Text(factor.isPositive ? "+\(factor.impact) pts" : "\(factor.impact) pts")
                                .font(.caption2)
                                .foregroundColor(factor.isPositive ? AppColors.secondary : AppColors.riskHigh)
                        }
                        Spacer()
                    }
                    .padding(10)
                    .background(AppColors.background.opacity(0.5))
                    .cornerRadius(8)
                }
            }
        }
        .padding(16)
        .background(AppColors.surface)
        .cornerRadius(14)
    }
}

struct RecommendationsCard: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        let risk = store.auditRisk
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommendations")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)

            ForEach(risk.recommendations.indices, id: \.self) { i in
                HStack(alignment: .top, spacing: 10) {
                    Text("\(i + 1)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(AppColors.primary)
                        .frame(width: 20, height: 20)
                        .background(AppColors.primary.opacity(0.15))
                        .cornerRadius(10)

                    Text(risk.recommendations[i])
                        .font(.caption)
                        .foregroundColor(.white)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding(16)
        .background(AppColors.surface)
        .cornerRadius(14)
    }
}

struct JurisdictionRiskBars: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Jurisdiction Exposure")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)

            ForEach(store.jurisdictionStats) { stat in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(Color(hex: stat.color))
                                .frame(width: 10, height: 10)
                            Text(stat.jurisdictionName)
                                .font(.caption)
                                .foregroundColor(.white)
                        }
                        Spacer()
                        Text("\(stat.daysSpent)/\(stat.dayLimit) days")
                            .font(.caption)
                            .foregroundColor(stat.riskLevel.color)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.gray.opacity(0.2))
                                .frame(height: 6)

                            // Risk zone background (70% threshold)
                            let warningStart = min(0.70 * geo.size.width, geo.size.width)
                            RoundedRectangle(cornerRadius: 3)
                                .fill(AppColors.riskModerate.opacity(0.15))
                                .frame(width: geo.size.width - warningStart, height: 6)
                                .offset(x: warningStart)

                            RoundedRectangle(cornerRadius: 3)
                                .fill(stat.riskLevel.color)
                                .frame(width: geo.size.width * stat.progressRatio, height: 6)
                        }
                    }
                    .frame(height: 6)
                }
                .padding(12)
                .background(AppColors.surface)
                .cornerRadius(10)
            }
        }
        .padding(16)
        .background(AppColors.surface)
        .cornerRadius(14)
    }
}
