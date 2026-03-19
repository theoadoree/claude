import SwiftUI

@main
struct TaxTrackApp: App {
    @StateObject private var store = DataStore()
    @StateObject private var locationService = LocationService()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .environmentObject(locationService)
                .preferredColorScheme(.dark)
                .onAppear {
                    locationService.configure(store: store)
                }
        }
    }
}

struct RootView: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        Group {
            if store.profile.hasCompletedOnboarding {
                MainTabView()
            } else {
                OnboardingView()
            }
        }
        .animation(.easeInOut, value: store.profile.hasCompletedOnboarding)
    }
}

struct MainTabView: View {
    @EnvironmentObject var store: DataStore
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }
                .tag(0)

            CalendarView()
                .tabItem {
                    Label("Calendar", systemImage: "calendar")
                }
                .tag(1)

            MapView()
                .tabItem {
                    Label("Map", systemImage: "map.fill")
                }
                .tag(2)

            PlanningView()
                .tabItem {
                    Label("Planning", systemImage: "chart.bar.fill")
                }
                .tag(3)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(4)
        }
        .tint(AppColors.primary)
    }
}

// MARK: - App Colors
enum AppColors {
    static let background = Color(hex: "#0C0C0E")
    static let surface = Color(hex: "#1C1C1E")
    static let primary = Color(hex: "#0A84FF")
    static let secondary = Color(hex: "#30D158")
    static let accent = Color(hex: "#FF9F0A")
    static let riskLow = Color(hex: "#30D158")
    static let riskModerate = Color(hex: "#FF9F0A")
    static let riskHigh = Color(hex: "#FF453A")
    static let riskCritical = Color(hex: "#8E2929")

    static let jurisdictionPalette: [Color] = [
        Color(hex: "#0A84FF"),
        Color(hex: "#30D158"),
        Color(hex: "#FF9F0A"),
        Color(hex: "#FF453A"),
        Color(hex: "#BF5AF2"),
        Color(hex: "#FF6B6B"),
        Color(hex: "#4ECDC4"),
        Color(hex: "#45B7D1"),
        Color(hex: "#FFA07A"),
        Color(hex: "#98D8C8")
    ]
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }

    func toHex() -> String {
        let uic = UIColor(self)
        guard let components = uic.cgColor.components, components.count >= 3 else {
            return "#000000"
        }
        let r = Float(components[0])
        let g = Float(components[1])
        let b = Float(components[2])
        return String(format: "#%02lX%02lX%02lX",
                      lroundf(r * 255),
                      lroundf(g * 255),
                      lroundf(b * 255))
    }
}
