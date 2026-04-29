import SwiftUI
import UniformTypeIdentifiers

// MARK: - SettingsView
struct SettingsView: View {
    @EnvironmentObject var store: DataStore
    @EnvironmentObject var locationService: LocationService
    @State private var showingManageJurisdictions = false
    @State private var showingImportCSV = false
    @State private var showingExportBackup = false
    @State private var showingImportBackup = false
    @State private var showingClearConfirm = false
    @State private var showingCSVImporter = false
    @State private var showingJSONImporter = false
    @State private var exportedBackupData: Data? = nil
    @State private var showingShareSheet = false
    @State private var csvImportResult: String? = nil
    @State private var backupImportResult: String? = nil
    @State private var alertMessage = ""
    @State private var showingAlert = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Profile Section
                        profileSection

                        // Location Tracking
                        trackingSection

                        // Jurisdictions
                        jurisdictionsSection

                        // Data Management
                        dataSection

                        // Danger Zone
                        dangerSection

                        // App Info
                        appInfoSection

                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .alert(alertMessage, isPresented: $showingAlert) {
                Button("OK", role: .cancel) {}
            }
            .confirmationDialog("Clear All Data", isPresented: $showingClearConfirm, titleVisibility: .visible) {
                Button("Clear All Data", role: .destructive) {
                    store.clearAll()
                    alertMessage = "All data has been cleared."
                    showingAlert = true
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will permanently delete all location entries, documents, and reset your profile. This cannot be undone.")
            }
            .sheet(isPresented: $showingManageJurisdictions) {
                ManageJurisdictionsView()
            }
            .sheet(isPresented: $showingShareSheet) {
                if let data = exportedBackupData {
                    ShareSheet(items: [data as Any])
                }
            }
            .fileImporter(
                isPresented: $showingCSVImporter,
                allowedContentTypes: [UTType.commaSeparatedText, UTType.text],
                allowsMultipleSelection: false
            ) { result in
                handleCSVImport(result)
            }
            .fileImporter(
                isPresented: $showingJSONImporter,
                allowedContentTypes: [UTType.json],
                allowsMultipleSelection: false
            ) { result in
                handleBackupImport(result)
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Profile Section
    private var profileSection: some View {
        SettingsSection(title: "Profile") {
            VStack(spacing: 0) {
                HStack(spacing: 14) {
                    ZStack {
                        Circle()
                            .fill(AppColors.primary.opacity(0.15))
                            .frame(width: 56, height: 56)
                        Image(systemName: "person.fill")
                            .font(.title2)
                            .foregroundColor(AppColors.primary)
                    }
                    VStack(alignment: .leading, spacing: 3) {
                        Text(store.profile.name.isEmpty ? "Set Your Name" : store.profile.name)
                            .font(.headline)
                            .foregroundColor(.white)
                        if let primaryId = store.profile.primaryJurisdictionId.isEmpty ? nil : store.profile.primaryJurisdictionId,
                           let j = store.jurisdiction(for: primaryId) {
                            HStack(spacing: 5) {
                                Circle()
                                    .fill(Color(hex: j.color))
                                    .frame(width: 8, height: 8)
                                Text("Primary: \(j.name)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    Spacer()
                }
                .padding(16)
            }
        }
    }

    // MARK: - Tracking Section
    private var trackingSection: some View {
        SettingsSection(title: "Location Tracking") {
            VStack(spacing: 0) {
                SettingsToggleRow(
                    icon: "location.fill",
                    iconColor: AppColors.primary,
                    title: "Background Tracking",
                    subtitle: "Auto-detect your jurisdiction every 5 min",
                    isOn: Binding(
                        get: { locationService.isTracking },
                        set: { newValue in
                            if newValue {
                                locationService.startTracking()
                            } else {
                                locationService.stopTracking()
                            }
                        }
                    )
                )

                Divider().padding(.horizontal, 16).background(Color.gray.opacity(0.2))

                SettingsInfoRow(
                    icon: "shield.fill",
                    iconColor: AppColors.secondary,
                    title: "Location Permission",
                    value: authStatusDescription
                )

                if locationService.authorizationStatus != .authorizedAlways {
                    Divider().padding(.horizontal, 16).background(Color.gray.opacity(0.2))
                    SettingsActionRow(
                        icon: "gearshape.fill",
                        iconColor: AppColors.accent,
                        title: "Open Settings",
                        subtitle: "Enable 'Always' location access"
                    ) {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                }
            }
        }
    }

    private var authStatusDescription: String {
        switch locationService.authorizationStatus {
        case .authorizedAlways: return "Always (optimal)"
        case .authorizedWhenInUse: return "When In Use"
        case .denied: return "Denied"
        case .restricted: return "Restricted"
        case .notDetermined: return "Not Set"
        @unknown default: return "Unknown"
        }
    }

    // MARK: - Jurisdictions Section
    private var jurisdictionsSection: some View {
        SettingsSection(title: "Jurisdictions") {
            SettingsActionRow(
                icon: "map.fill",
                iconColor: Color(hex: "#BF5AF2"),
                title: "Manage Jurisdictions",
                subtitle: "\(store.jurisdictions.filter { $0.isTracked }.count) tracked"
            ) {
                showingManageJurisdictions = true
            }
        }
    }

    // MARK: - Data Section
    private var dataSection: some View {
        SettingsSection(title: "Data Management") {
            VStack(spacing: 0) {
                SettingsActionRow(
                    icon: "doc.text.fill",
                    iconColor: AppColors.secondary,
                    title: "Import CSV",
                    subtitle: "Monaeo-compatible format"
                ) {
                    showingCSVImporter = true
                }

                Divider().padding(.horizontal, 16).background(Color.gray.opacity(0.2))

                SettingsActionRow(
                    icon: "arrow.up.doc.fill",
                    iconColor: AppColors.primary,
                    title: "Export Backup",
                    subtitle: "Save all data as JSON"
                ) {
                    exportBackup()
                }

                Divider().padding(.horizontal, 16).background(Color.gray.opacity(0.2))

                SettingsActionRow(
                    icon: "arrow.down.doc.fill",
                    iconColor: AppColors.accent,
                    title: "Import Backup",
                    subtitle: "Restore from JSON backup"
                ) {
                    showingJSONImporter = true
                }

                Divider().padding(.horizontal, 16).background(Color.gray.opacity(0.2))

                SettingsInfoRow(
                    icon: "internaldrive.fill",
                    iconColor: .secondary,
                    title: "Storage",
                    value: storageInfo
                )
            }
        }
    }

    private var storageInfo: String {
        "\(store.entries.count) entries • \(store.documents.count) docs"
    }

    // MARK: - Danger Section
    private var dangerSection: some View {
        SettingsSection(title: "Danger Zone") {
            Button {
                showingClearConfirm = true
            } label: {
                HStack {
                    Image(systemName: "trash.fill")
                        .foregroundColor(AppColors.riskHigh)
                    Text("Clear All Data")
                        .foregroundColor(AppColors.riskHigh)
                    Spacer()
                }
                .padding(16)
            }
        }
    }

    // MARK: - App Info Section
    private var appInfoSection: some View {
        SettingsSection(title: "About") {
            VStack(spacing: 0) {
                SettingsInfoRow(icon: "info.circle.fill", iconColor: AppColors.primary, title: "Version", value: "1.0.0")
                Divider().padding(.horizontal, 16).background(Color.gray.opacity(0.2))
                SettingsInfoRow(icon: "lock.fill", iconColor: AppColors.secondary, title: "Privacy", value: "Data stored locally")
            }
        }
    }

    // MARK: - Actions
    private func exportBackup() {
        guard let data = store.exportBackup() else {
            alertMessage = "Failed to create backup."
            showingAlert = true
            return
        }
        exportedBackupData = data
        showingShareSheet = true
    }

    private func handleCSVImport(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            guard url.startAccessingSecurityScopedResource() else { return }
            defer { url.stopAccessingSecurityScopedResource() }
            guard let csvString = try? String(contentsOf: url, encoding: .utf8) else {
                alertMessage = "Failed to read CSV file."
                showingAlert = true
                return
            }
            store.importCSV(csvString)
            alertMessage = "CSV imported successfully."
            showingAlert = true
        case .failure(let error):
            alertMessage = "Import failed: \(error.localizedDescription)"
            showingAlert = true
        }
    }

    private func handleBackupImport(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            guard url.startAccessingSecurityScopedResource() else { return }
            defer { url.stopAccessingSecurityScopedResource() }
            guard let data = try? Data(contentsOf: url) else {
                alertMessage = "Failed to read backup file."
                showingAlert = true
                return
            }
            if store.importBackup(from: data) {
                alertMessage = "Backup restored successfully."
            } else {
                alertMessage = "Invalid backup file format."
            }
            showingAlert = true
        case .failure(let error):
            alertMessage = "Import failed: \(error.localizedDescription)"
            showingAlert = true
        }
    }
}

// MARK: - Settings Section
struct SettingsSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
                .tracking(0.5)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                content
            }
            .background(AppColors.surface)
            .cornerRadius(14)
        }
    }
}

// MARK: - Settings Row Components
struct SettingsToggleRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String
    @Binding var isOn: Bool

    var body: some View {
        Toggle(isOn: $isOn) {
            HStack(spacing: 14) {
                SettingsIcon(icon: icon, color: iconColor)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .foregroundColor(.white)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .tint(AppColors.primary)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

struct SettingsInfoRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 14) {
            SettingsIcon(icon: icon, color: iconColor)
            Text(title)
                .font(.subheadline)
                .foregroundColor(.white)
            Spacer()
            Text(value)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

struct SettingsActionRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String?
    let action: () -> Void

    init(icon: String, iconColor: Color, title: String, subtitle: String? = nil, action: @escaping () -> Void) {
        self.icon = icon
        self.iconColor = iconColor
        self.title = title
        self.subtitle = subtitle
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                SettingsIcon(icon: icon, color: iconColor)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .foregroundColor(.white)
                    if let sub = subtitle {
                        Text(sub)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct SettingsIcon: View {
    let icon: String
    let color: Color

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(color)
                .frame(width: 32, height: 32)
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white)
        }
    }
}

// MARK: - Share Sheet
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        return controller
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
