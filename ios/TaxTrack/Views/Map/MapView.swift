import SwiftUI
import MapKit

// MARK: - MapView
struct MapView: View {
    @EnvironmentObject var store: DataStore
    @State private var position: MapCameraPosition = .automatic
    @State private var selectedEntry: LocationEntry?
    @State private var showingEntryDetail = false
    @State private var filterJurisdictionId: String? = nil
    @State private var mapStyle: MapStyle = .standard(elevation: .realistic)

    private var displayedEntries: [LocationEntry] {
        let filtered = store.entries.filter { entry in
            entry.latitude != 0 || entry.longitude != 0
        }
        if let filterId = filterJurisdictionId {
            return filtered.filter { $0.jurisdictionId == filterId }
        }
        return filtered
    }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                // Map
                Map(position: $position, selection: $selectedEntry) {
                    ForEach(displayedEntries) { entry in
                        let color = jurisdictionColor(for: entry.jurisdictionId)
                        Annotation(
                            entry.locationDescription.isEmpty ? entry.date : entry.locationDescription,
                            coordinate: CLLocationCoordinate2D(
                                latitude: entry.latitude,
                                longitude: entry.longitude
                            ),
                            anchor: .bottom
                        ) {
                            LocationPin(entry: entry, color: color, isSelected: selectedEntry?.id == entry.id)
                                .onTapGesture {
                                    selectedEntry = entry
                                    showingEntryDetail = true
                                }
                        }
                    }

                    UserAnnotation()
                }
                .mapStyle(mapStyle)
                .ignoresSafeArea(edges: .top)

                // Bottom overlay
                VStack(spacing: 0) {
                    // Jurisdiction filter chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            FilterChip(
                                title: "All",
                                color: .white,
                                isSelected: filterJurisdictionId == nil
                            )
                            .onTapGesture { filterJurisdictionId = nil }

                            ForEach(store.jurisdictions.filter { $0.isTracked }) { j in
                                FilterChip(
                                    title: j.name,
                                    color: Color(hex: j.color),
                                    isSelected: filterJurisdictionId == j.id
                                )
                                .onTapGesture {
                                    filterJurisdictionId = (filterJurisdictionId == j.id) ? nil : j.id
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                    }
                    .background(.ultraThinMaterial)

                    // Stats bar
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(displayedEntries.count) locations")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            Text("in \(store.selectedYear)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Button {
                            recenterMap()
                        } label: {
                            Image(systemName: "location.fill")
                                .foregroundColor(AppColors.primary)
                                .frame(width: 36, height: 36)
                                .background(AppColors.surface)
                                .cornerRadius(10)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(AppColors.background.opacity(0.95))
                }
            }
            .navigationTitle("Map")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("Standard") { mapStyle = .standard(elevation: .realistic) }
                        Button("Satellite") { mapStyle = .imagery(elevation: .realistic) }
                        Button("Hybrid") { mapStyle = .hybrid(elevation: .realistic) }
                    } label: {
                        Image(systemName: "map")
                            .foregroundColor(AppColors.primary)
                    }
                }
            }
            .sheet(item: $selectedEntry) { entry in
                EntryDetailSheet(entry: entry)
            }
            .onAppear {
                recenterMap()
            }
        }
        .preferredColorScheme(.dark)
    }

    private func jurisdictionColor(for id: String) -> Color {
        if let j = store.jurisdiction(for: id) {
            return Color(hex: j.color)
        }
        return AppColors.primary
    }

    private func recenterMap() {
        let yearEntries = store.entries.filter {
            $0.date.hasPrefix("\(store.selectedYear)") && ($0.latitude != 0 || $0.longitude != 0)
        }
        if yearEntries.isEmpty {
            position = .automatic
            return
        }
        // Center on most recent entry
        if let latest = yearEntries.sorted(by: { $0.date > $1.date }).first {
            position = .camera(
                MapCamera(
                    centerCoordinate: CLLocationCoordinate2D(
                        latitude: latest.latitude,
                        longitude: latest.longitude
                    ),
                    distance: 500_000
                )
            )
        }
    }
}

// MARK: - Location Pin
struct LocationPin: View {
    let entry: LocationEntry
    let color: Color
    let isSelected: Bool

    var body: some View {
        ZStack {
            Circle()
                .fill(color.opacity(0.2))
                .frame(width: isSelected ? 36 : 24, height: isSelected ? 36 : 24)
            Circle()
                .fill(color)
                .frame(width: isSelected ? 18 : 12, height: isSelected ? 18 : 12)
            if entry.isVerified {
                Image(systemName: "checkmark")
                    .font(.system(size: 6, weight: .bold))
                    .foregroundColor(.white)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isSelected)
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let color: Color
    let isSelected: Bool

    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(title)
                .font(.caption)
                .fontWeight(isSelected ? .semibold : .regular)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(isSelected ? color.opacity(0.2) : AppColors.surface)
        .foregroundColor(isSelected ? color : .secondary)
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(isSelected ? color.opacity(0.5) : Color.clear, lineWidth: 1)
        )
    }
}

// MARK: - Entry Detail Sheet (from map tap)
struct EntryDetailSheet: View {
    @EnvironmentObject var store: DataStore
    let entry: LocationEntry
    @Environment(\.dismiss) var dismiss
    @State private var showingEdit = false

    private var jurisdiction: Jurisdiction? { store.jurisdiction(for: entry.jurisdictionId) }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                VStack(spacing: 20) {
                    // Map snippet
                    Map(position: .constant(.camera(MapCamera(
                        centerCoordinate: CLLocationCoordinate2D(latitude: entry.latitude, longitude: entry.longitude),
                        distance: 50_000
                    )))) {
                        Annotation("", coordinate: CLLocationCoordinate2D(latitude: entry.latitude, longitude: entry.longitude)) {
                            Image(systemName: "mappin.circle.fill")
                                .font(.title)
                                .foregroundColor(jurisdiction.map { Color(hex: $0.color) } ?? AppColors.primary)
                        }
                    }
                    .mapStyle(.standard)
                    .frame(height: 160)
                    .cornerRadius(14)
                    .padding(.horizontal, 16)

                    VStack(spacing: 16) {
                        // Jurisdiction
                        if let j = jurisdiction {
                            HStack {
                                Circle()
                                    .fill(Color(hex: j.color))
                                    .frame(width: 14, height: 14)
                                Text(j.name)
                                    .font(.headline)
                                    .foregroundColor(.white)
                                Spacer()
                            }
                        }

                        // Details
                        VStack(spacing: 10) {
                            DetailRow(icon: "calendar", label: "Date", value: formatDate(entry.date))
                            if !entry.locationDescription.isEmpty {
                                DetailRow(icon: "location.fill", label: "Location", value: entry.locationDescription)
                            }
                            DetailRow(icon: entry.activityType.icon, label: "Activity", value: entry.activityType.displayName)
                            DetailRow(icon: "antenna.radiowaves.left.and.right", label: "Source", value: entry.source.displayName)
                            if entry.isVerified {
                                DetailRow(icon: "checkmark.shield.fill", label: "Verified", value: "Yes")
                            }
                            if !entry.notes.isEmpty {
                                DetailRow(icon: "note.text", label: "Notes", value: entry.notes)
                            }
                        }
                        .padding(16)
                        .background(AppColors.surface)
                        .cornerRadius(14)
                        .padding(.horizontal, 16)
                    }

                    Spacer()
                }
                .padding(.top, 16)
            }
            .navigationTitle(formatDate(entry.date))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundColor(.secondary)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Edit") { showingEdit = true }
                        .foregroundColor(AppColors.primary)
                }
            }
            .sheet(isPresented: $showingEdit) {
                AddLocationView(existingEntry: entry)
            }
        }
        .preferredColorScheme(.dark)
    }

    private func formatDate(_ str: String) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        if let d = f.date(from: str) {
            f.dateFormat = "EEEE, MMM d, yyyy"
            return f.string(from: d)
        }
        return str
    }
}

struct DetailRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 20)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 70, alignment: .leading)
            Text(value)
                .font(.subheadline)
                .foregroundColor(.white)
            Spacer()
        }
    }
}
