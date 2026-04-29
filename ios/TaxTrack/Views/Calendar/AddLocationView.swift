import SwiftUI

// MARK: - AddLocationView
struct AddLocationView: View {
    @EnvironmentObject var store: DataStore
    @Environment(\.dismiss) var dismiss

    // Can be initialized with a date (new entry) or existing entry (edit)
    var date: String?
    var existingEntry: LocationEntry?

    @State private var selectedDate: String
    @State private var selectedJurisdictionId: String
    @State private var city: String
    @State private var state: String
    @State private var country: String
    @State private var activityType: ActivityType
    @State private var isVerified: Bool
    @State private var notes: String
    @State private var showingDeleteConfirm = false

    private var isEditing: Bool { existingEntry != nil }

    init(date: String? = nil, existingEntry: LocationEntry? = nil) {
        self.date = date
        self.existingEntry = existingEntry

        if let entry = existingEntry {
            _selectedDate = State(initialValue: entry.date)
            _selectedJurisdictionId = State(initialValue: entry.jurisdictionId)
            _city = State(initialValue: entry.city)
            _state = State(initialValue: entry.state)
            _country = State(initialValue: entry.country)
            _activityType = State(initialValue: entry.activityType)
            _isVerified = State(initialValue: entry.isVerified)
            _notes = State(initialValue: entry.notes)
        } else {
            let dateStr = date ?? {
                let f = DateFormatter()
                f.dateFormat = "yyyy-MM-dd"
                return f.string(from: Date())
            }()
            _selectedDate = State(initialValue: dateStr)
            _selectedJurisdictionId = State(initialValue: "")
            _city = State(initialValue: "")
            _state = State(initialValue: "")
            _country = State(initialValue: "United States")
            _activityType = State(initialValue: .unknown)
            _isVerified = State(initialValue: false)
            _notes = State(initialValue: "")
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Date Picker
                        FormSection(title: "Date") {
                            DatePickerField(dateString: $selectedDate)
                        }

                        // Jurisdiction Picker
                        FormSection(title: "Jurisdiction") {
                            JurisdictionPickerField(selectedId: $selectedJurisdictionId)
                        }

                        // Location Details
                        FormSection(title: "Location Details") {
                            VStack(spacing: 12) {
                                FormTextField(label: "City", placeholder: "e.g. New York", text: $city)
                                FormTextField(label: "State / Region", placeholder: "e.g. New York", text: $state)
                                FormTextField(label: "Country", placeholder: "e.g. United States", text: $country)
                            }
                        }

                        // Activity Type
                        FormSection(title: "Activity Type") {
                            HStack(spacing: 8) {
                                ForEach(ActivityType.allCases, id: \.self) { type in
                                    ActivityTypeChip(type: type, isSelected: activityType == type)
                                        .onTapGesture { activityType = type }
                                }
                            }
                        }

                        // Verified Toggle
                        FormSection(title: "Verification") {
                            Toggle(isOn: $isVerified) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Mark as Verified")
                                        .font(.subheadline)
                                        .foregroundColor(.white)
                                    Text("You have documentation to support this location")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            .tint(AppColors.secondary)
                            .padding(14)
                            .background(AppColors.surface)
                            .cornerRadius(10)
                        }

                        // Notes
                        FormSection(title: "Notes (Optional)") {
                            ZStack(alignment: .topLeading) {
                                TextEditor(text: $notes)
                                    .frame(minHeight: 80)
                                    .padding(10)
                                    .background(AppColors.surface)
                                    .cornerRadius(10)
                                    .foregroundColor(.white)
                                    .scrollContentBackground(.hidden)
                                if notes.isEmpty {
                                    Text("Additional context, meeting details, etc.")
                                        .font(.subheadline)
                                        .foregroundColor(Color.secondary.opacity(0.5))
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 18)
                                        .allowsHitTesting(false)
                                }
                            }
                        }

                        // Delete button (edit mode only)
                        if isEditing {
                            Button(role: .destructive) {
                                showingDeleteConfirm = true
                            } label: {
                                Label("Delete Entry", systemImage: "trash")
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(AppColors.riskHigh.opacity(0.15))
                                    .foregroundColor(AppColors.riskHigh)
                                    .cornerRadius(14)
                            }
                        }

                        Spacer(minLength: 32)
                    }
                    .padding(16)
                }
            }
            .navigationTitle(isEditing ? "Edit Entry" : "Add Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.secondary)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { saveEntry() }
                        .fontWeight(.semibold)
                        .foregroundColor(canSave ? AppColors.primary : .secondary)
                        .disabled(!canSave)
                }
            }
            .confirmationDialog("Delete Entry", isPresented: $showingDeleteConfirm, titleVisibility: .visible) {
                Button("Delete", role: .destructive) {
                    if let entry = existingEntry {
                        store.removeLocationEntry(id: entry.id)
                    }
                    dismiss()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will permanently remove this location entry.")
            }
            .onAppear {
                if selectedJurisdictionId.isEmpty {
                    selectedJurisdictionId = store.jurisdictions.first { $0.isPrimary }?.id
                        ?? store.jurisdictions.first { $0.isTracked }?.id
                        ?? store.jurisdictions.first?.id
                        ?? ""
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    var canSave: Bool {
        !selectedDate.isEmpty && !selectedJurisdictionId.isEmpty
    }

    private func saveEntry() {
        let entry = LocationEntry(
            id: existingEntry?.id ?? UUID().uuidString,
            date: selectedDate,
            jurisdictionId: selectedJurisdictionId,
            city: city.trimmingCharacters(in: .whitespaces),
            state: state.trimmingCharacters(in: .whitespaces),
            country: country.trimmingCharacters(in: .whitespaces),
            latitude: existingEntry?.latitude ?? 0,
            longitude: existingEntry?.longitude ?? 0,
            activityType: activityType,
            isVerified: isVerified,
            source: existingEntry?.source ?? .manual,
            notes: notes.trimmingCharacters(in: .whitespaces),
            documentIds: existingEntry?.documentIds ?? []
        )

        if isEditing {
            store.updateLocationEntry(entry)
        } else {
            store.addLocationEntry(entry)
        }
        dismiss()
    }
}

// MARK: - Form Components
struct FormSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
                .textCase(.uppercase)
                .tracking(0.5)
            content
        }
    }
}

struct FormTextField: View {
    let label: String
    let placeholder: String
    @Binding var text: String

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .frame(width: 100, alignment: .leading)
            TextField(placeholder, text: $text)
                .font(.subheadline)
                .foregroundColor(.white)
                .multilineTextAlignment(.trailing)
        }
        .padding(14)
        .background(AppColors.surface)
        .cornerRadius(10)
    }
}

struct DatePickerField: View {
    @Binding var dateString: String

    @State private var selectedDate: Date = Date()
    @State private var showingPicker = false

    var body: some View {
        Button {
            showingPicker = true
        } label: {
            HStack {
                Text("Date")
                    .font(.subheadline)
                    .foregroundColor(.white)
                Spacer()
                Text(formattedDate)
                    .font(.subheadline)
                    .foregroundColor(AppColors.primary)
                Image(systemName: "calendar")
                    .foregroundColor(AppColors.primary)
            }
            .padding(14)
            .background(AppColors.surface)
            .cornerRadius(10)
        }
        .sheet(isPresented: $showingPicker) {
            DatePickerSheet(dateString: $dateString, selectedDate: $selectedDate)
        }
        .onAppear { parseDate() }
    }

    private var formattedDate: String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        if let d = f.date(from: dateString) {
            f.dateFormat = "MMM d, yyyy"
            return f.string(from: d)
        }
        return dateString
    }

    private func parseDate() {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        if let d = f.date(from: dateString) {
            selectedDate = d
        }
    }
}

struct DatePickerSheet: View {
    @Binding var dateString: String
    @Binding var selectedDate: Date
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()
                DatePicker("Select Date", selection: $selectedDate, displayedComponents: .date)
                    .datePickerStyle(.graphical)
                    .tint(AppColors.primary)
                    .padding()
            }
            .navigationTitle("Select Date")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        let f = DateFormatter()
                        f.dateFormat = "yyyy-MM-dd"
                        dateString = f.string(from: selectedDate)
                        dismiss()
                    }
                    .foregroundColor(AppColors.primary)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct JurisdictionPickerField: View {
    @EnvironmentObject var store: DataStore
    @Binding var selectedId: String

    private var selected: Jurisdiction? { store.jurisdiction(for: selectedId) }

    var body: some View {
        Menu {
            ForEach(store.jurisdictions) { j in
                Button {
                    selectedId = j.id
                } label: {
                    Label(j.name, systemImage: selectedId == j.id ? "checkmark" : "")
                }
            }
        } label: {
            HStack {
                Text("Jurisdiction")
                    .font(.subheadline)
                    .foregroundColor(.white)
                Spacer()
                if let j = selected {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color(hex: j.color))
                            .frame(width: 10, height: 10)
                        Text(j.name)
                            .font(.subheadline)
                            .foregroundColor(AppColors.primary)
                    }
                } else {
                    Text("Select")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Image(systemName: "chevron.up.chevron.down")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(14)
            .background(AppColors.surface)
            .cornerRadius(10)
        }
    }
}

struct ActivityTypeChip: View {
    let type: ActivityType
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: type.icon)
                .font(.system(size: 16))
            Text(type.displayName)
                .font(.caption2)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .foregroundColor(isSelected ? .white : .secondary)
        .background(isSelected ? AppColors.primary : AppColors.surface)
        .cornerRadius(10)
    }
}
