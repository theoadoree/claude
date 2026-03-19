import SwiftUI
import CoreLocation

// MARK: - OnboardingView
struct OnboardingView: View {
    @EnvironmentObject var store: DataStore
    @EnvironmentObject var locationService: LocationService

    var body: some View {
        NavigationStack {
            WelcomeView()
        }
        .preferredColorScheme(.dark)
    }
}

// MARK: - WelcomeView
struct WelcomeView: View {
    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Logo area
                VStack(spacing: 20) {
                    ZStack {
                        Circle()
                            .fill(AppColors.primary.opacity(0.15))
                            .frame(width: 120, height: 120)
                        Image(systemName: "mappin.and.ellipse")
                            .font(.system(size: 52, weight: .semibold))
                            .foregroundColor(AppColors.primary)
                    }

                    VStack(spacing: 8) {
                        Text("TaxTrack")
                            .font(.system(size: 40, weight: .bold))
                            .foregroundColor(.white)
                        Text("Tax Residency Intelligence")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Features list
                VStack(alignment: .leading, spacing: 18) {
                    FeatureRow(icon: "location.fill", color: AppColors.primary, title: "Automatic Tracking", description: "Track your physical presence across tax jurisdictions")
                    FeatureRow(icon: "calendar", color: AppColors.secondary, title: "Day Counting", description: "183-day rule and other tax thresholds monitored")
                    FeatureRow(icon: "shield.fill", color: AppColors.accent, title: "Audit Protection", description: "Build an evidence vault with documents and photos")
                    FeatureRow(icon: "chart.bar.fill", color: Color(hex: "#BF5AF2"), title: "Tax Planning", description: "Insights and recommendations to optimize your taxes")
                }
                .padding(.horizontal, 32)

                Spacer()

                NavigationLink(destination: ResidencySetupView()) {
                    HStack {
                        Text("Get Started")
                            .font(.headline)
                        Image(systemName: "arrow.right")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(AppColors.primary)
                    .foregroundColor(.white)
                    .cornerRadius(14)
                    .padding(.horizontal, 24)
                }

                Text("Your data is stored privately on your device")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 12)
                    .padding(.bottom, 32)
            }
        }
        .navigationBarHidden(true)
    }
}

struct FeatureRow: View {
    let icon: String
    let color: Color
    let title: String
    let description: String

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(color.opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(color)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

// MARK: - ResidencySetupView
struct ResidencySetupView: View {
    @EnvironmentObject var store: DataStore
    @State private var name: String = ""
    @State private var selectedJurisdictionId: String = ""
    @FocusState private var nameFocused: Bool

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    // Header
                    VStack(spacing: 10) {
                        Image(systemName: "person.fill.badge.plus")
                            .font(.system(size: 44))
                            .foregroundColor(AppColors.primary)
                        Text("Your Profile")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text("Tell us about your primary tax residency")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 32)

                    // Name field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Your Name")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                        TextField("Enter your name", text: $name)
                            .padding()
                            .background(AppColors.surface)
                            .cornerRadius(12)
                            .foregroundColor(.white)
                            .focused($nameFocused)
                    }
                    .padding(.horizontal, 24)

                    // Primary jurisdiction
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Primary Residence")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 24)

                        ScrollView(.vertical, showsIndicators: false) {
                            VStack(spacing: 8) {
                                ForEach(store.jurisdictions) { jurisdiction in
                                    JurisdictionSelectionRow(
                                        jurisdiction: jurisdiction,
                                        isSelected: selectedJurisdictionId == jurisdiction.id
                                    )
                                    .onTapGesture {
                                        selectedJurisdictionId = jurisdiction.id
                                    }
                                }
                            }
                            .padding(.horizontal, 24)
                        }
                        .frame(maxHeight: 280)
                    }

                    Spacer(minLength: 20)

                    NavigationLink(destination: JurisdictionSetupView()) {
                        HStack {
                            Text("Continue")
                                .font(.headline)
                            Image(systemName: "arrow.right")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(canContinue ? AppColors.primary : AppColors.surface)
                        .foregroundColor(canContinue ? .white : .secondary)
                        .cornerRadius(14)
                        .padding(.horizontal, 24)
                    }
                    .disabled(!canContinue)
                    .simultaneousGesture(TapGesture().onEnded {
                        if canContinue { saveProfile() }
                    })
                    .padding(.bottom, 32)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if selectedJurisdictionId.isEmpty {
                selectedJurisdictionId = store.jurisdictions.first?.id ?? ""
            }
        }
    }

    var canContinue: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty && !selectedJurisdictionId.isEmpty
    }

    func saveProfile() {
        var updated = store.profile
        updated.name = name.trimmingCharacters(in: .whitespaces)
        updated.primaryJurisdictionId = selectedJurisdictionId
        store.updateProfile(updated)
        store.setPrimaryJurisdiction(id: selectedJurisdictionId)
    }
}

struct JurisdictionSelectionRow: View {
    let jurisdiction: Jurisdiction
    let isSelected: Bool

    var body: some View {
        HStack {
            Circle()
                .fill(Color(hex: jurisdiction.color))
                .frame(width: 12, height: 12)
            VStack(alignment: .leading, spacing: 2) {
                Text(jurisdiction.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                Text("\(jurisdiction.dayLimit)-day limit • \(jurisdiction.taxRule)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(AppColors.primary)
            } else {
                Circle()
                    .strokeBorder(Color.gray.opacity(0.4), lineWidth: 1.5)
                    .frame(width: 22, height: 22)
            }
        }
        .padding(14)
        .background(isSelected ? AppColors.primary.opacity(0.12) : AppColors.surface)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(isSelected ? AppColors.primary.opacity(0.5) : Color.clear, lineWidth: 1)
        )
    }
}

// MARK: - JurisdictionSetupView
struct JurisdictionSetupView: View {
    @EnvironmentObject var store: DataStore
    @State private var trackedIds: Set<String> = []

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                VStack(spacing: 10) {
                    Image(systemName: "map.fill")
                        .font(.system(size: 44))
                        .foregroundColor(AppColors.secondary)
                    Text("Track Jurisdictions")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    Text("Select the states and countries you want to track")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 32)
                .padding(.horizontal, 24)
                .padding(.bottom, 24)

                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(store.jurisdictions) { jurisdiction in
                            TrackedJurisdictionRow(
                                jurisdiction: jurisdiction,
                                isTracked: trackedIds.contains(jurisdiction.id)
                            )
                            .onTapGesture {
                                if trackedIds.contains(jurisdiction.id) {
                                    trackedIds.remove(jurisdiction.id)
                                } else {
                                    trackedIds.insert(jurisdiction.id)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                }

                NavigationLink(destination: TrackingPermissionsView()) {
                    HStack {
                        Text("Continue")
                            .font(.headline)
                        Image(systemName: "arrow.right")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(AppColors.primary)
                    .foregroundColor(.white)
                    .cornerRadius(14)
                    .padding(.horizontal, 24)
                }
                .simultaneousGesture(TapGesture().onEnded { saveTracked() })
                .padding(.vertical, 24)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            trackedIds = Set(store.jurisdictions.filter { $0.isTracked }.map { $0.id })
        }
    }

    func saveTracked() {
        for i in store.jurisdictions.indices {
            store.jurisdictions[i].isTracked = trackedIds.contains(store.jurisdictions[i].id)
        }
        var updated = store.profile
        updated.trackedJurisdictionIds = Array(trackedIds)
        store.updateProfile(updated)
    }
}

struct TrackedJurisdictionRow: View {
    let jurisdiction: Jurisdiction
    let isTracked: Bool

    var body: some View {
        HStack {
            Toggle("", isOn: .constant(isTracked))
                .labelsHidden()
                .tint(Color(hex: jurisdiction.color))
                .allowsHitTesting(false)
            VStack(alignment: .leading, spacing: 2) {
                Text(jurisdiction.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                Text("\(jurisdiction.taxRule) • \(jurisdiction.dayLimit) days")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Circle()
                .fill(Color(hex: jurisdiction.color))
                .frame(width: 10, height: 10)
        }
        .padding(14)
        .background(AppColors.surface)
        .cornerRadius(12)
    }
}

// MARK: - TrackingPermissionsView
struct TrackingPermissionsView: View {
    @EnvironmentObject var store: DataStore
    @EnvironmentObject var locationService: LocationService
    @State private var permissionRequested = false

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                VStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(AppColors.secondary.opacity(0.15))
                            .frame(width: 100, height: 100)
                        Image(systemName: "location.fill")
                            .font(.system(size: 44))
                            .foregroundColor(AppColors.secondary)
                    }

                    Text("Enable Location Tracking")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    Text("TaxTrack needs your location to automatically track which tax jurisdiction you're in. Your data stays on your device.")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }

                VStack(spacing: 16) {
                    PermissionRow(icon: "location.fill", title: "Always Allow Location", description: "Background tracking every 5 minutes")
                    PermissionRow(icon: "lock.fill", title: "Private & Secure", description: "All data stored locally on device")
                    PermissionRow(icon: "battery.100", title: "Low Battery Impact", description: "Optimized for minimal battery use")
                }
                .padding(.horizontal, 32)

                Spacer()

                VStack(spacing: 12) {
                    Button {
                        locationService.requestAlwaysPermission()
                        permissionRequested = true
                    } label: {
                        HStack {
                            Image(systemName: "location.fill")
                            Text("Allow Location Access")
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(AppColors.primary)
                        .foregroundColor(.white)
                        .cornerRadius(14)
                    }
                    .padding(.horizontal, 24)

                    Button {
                        completeOnboarding()
                    } label: {
                        Text("Skip for Now")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.bottom, 32)
            }
        }
        .navigationBarHidden(true)
        .onChange(of: locationService.authorizationStatus) { _, status in
            if status == .authorizedAlways || status == .authorizedWhenInUse {
                locationService.startTracking()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    completeOnboarding()
                }
            }
        }
    }

    func completeOnboarding() {
        var updated = store.profile
        updated.hasCompletedOnboarding = true
        store.updateProfile(updated)
    }
}

struct PermissionRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(AppColors.primary.opacity(0.12))
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(AppColors.primary)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
    }
}
