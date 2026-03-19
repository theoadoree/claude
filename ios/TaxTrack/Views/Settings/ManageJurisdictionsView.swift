import SwiftUI

// MARK: - ManageJurisdictionsView
struct ManageJurisdictionsView: View {
    @EnvironmentObject var store: DataStore
    @Environment(\.dismiss) var dismiss
    @State private var showingAddJurisdiction = false
    @State private var editingJurisdiction: Jurisdiction? = nil

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Summary
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(store.jurisdictions.filter { $0.isTracked }.count) tracked")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            Text("of \(store.jurisdictions.count) total jurisdictions")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Button {
                            showingAddJurisdiction = true
                        } label: {
                            Label("Add", systemImage: "plus.circle.fill")
                                .font(.subheadline)
                                .foregroundColor(AppColors.primary)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)

                    Divider()
                        .background(Color.gray.opacity(0.3))

                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(store.jurisdictions) { jurisdiction in
                                JurisdictionManageRow(
                                    jurisdiction: jurisdiction,
                                    onToggleTracked: { toggleTracked(jurisdiction) },
                                    onSetPrimary: { setPrimary(jurisdiction) },
                                    onEdit: { editingJurisdiction = jurisdiction },
                                    onDelete: { deleteJurisdiction(jurisdiction) }
                                )
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                }
            }
            .navigationTitle("Manage Jurisdictions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") { dismiss() }
                        .foregroundColor(AppColors.primary)
                }
            }
            .sheet(isPresented: $showingAddJurisdiction) {
                EditJurisdictionView(jurisdiction: nil)
            }
            .sheet(item: $editingJurisdiction) { j in
                EditJurisdictionView(jurisdiction: j)
            }
        }
        .preferredColorScheme(.dark)
    }

    private func toggleTracked(_ j: Jurisdiction) {
        var updated = j
        updated.isTracked.toggle()
        store.updateJurisdiction(updated)
    }

    private func setPrimary(_ j: Jurisdiction) {
        store.setPrimaryJurisdiction(id: j.id)
    }

    private func deleteJurisdiction(_ j: Jurisdiction) {
        store.removeJurisdiction(id: j.id)
    }
}

// MARK: - Jurisdiction Manage Row
struct JurisdictionManageRow: View {
    let jurisdiction: Jurisdiction
    let onToggleTracked: () -> Void
    let onSetPrimary: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    @State private var showingDeleteConfirm = false

    var body: some View {
        HStack(spacing: 12) {
            // Color dot
            Circle()
                .fill(Color(hex: jurisdiction.color))
                .frame(width: 14, height: 14)

            // Info
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(jurisdiction.name)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    if jurisdiction.isPrimary {
                        Text("PRIMARY")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(AppColors.secondary)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(AppColors.secondary.opacity(0.15))
                            .cornerRadius(4)
                    }
                }
                Text("\(jurisdiction.dayLimit)-day limit • \(jurisdiction.type.displayName)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Controls
            HStack(spacing: 10) {
                Toggle("", isOn: Binding(
                    get: { jurisdiction.isTracked },
                    set: { _ in onToggleTracked() }
                ))
                .labelsHidden()
                .tint(Color(hex: jurisdiction.color))
                .scaleEffect(0.85)

                Menu {
                    if !jurisdiction.isPrimary {
                        Button {
                            onSetPrimary()
                        } label: {
                            Label("Set as Primary", systemImage: "star.fill")
                        }
                    }
                    Button {
                        onEdit()
                    } label: {
                        Label("Edit", systemImage: "pencil")
                    }
                    Divider()
                    Button(role: .destructive) {
                        showingDeleteConfirm = true
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.title3)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(14)
        .background(AppColors.surface)
        .cornerRadius(12)
        .confirmationDialog("Delete Jurisdiction", isPresented: $showingDeleteConfirm, titleVisibility: .visible) {
            Button("Delete", role: .destructive) { onDelete() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will also remove all location entries for \(jurisdiction.name).")
        }
    }
}

// MARK: - Edit Jurisdiction View
struct EditJurisdictionView: View {
    @EnvironmentObject var store: DataStore
    @Environment(\.dismiss) var dismiss

    let jurisdiction: Jurisdiction?
    private var isEditing: Bool { jurisdiction != nil }

    @State private var name: String
    @State private var type: JurisdictionType
    @State private var selectedColor: String
    @State private var dayLimit: Int
    @State private var taxRule: String
    @State private var isTracked: Bool

    private let colorPalette = [
        "#0A84FF", "#30D158", "#FF9F0A", "#FF453A",
        "#BF5AF2", "#FF6B6B", "#4ECDC4", "#45B7D1",
        "#FFA07A", "#98D8C8"
    ]

    init(jurisdiction: Jurisdiction?) {
        self.jurisdiction = jurisdiction
        _name = State(initialValue: jurisdiction?.name ?? "")
        _type = State(initialValue: jurisdiction?.type ?? .state)
        _selectedColor = State(initialValue: jurisdiction?.color ?? "#0A84FF")
        _dayLimit = State(initialValue: jurisdiction?.dayLimit ?? 183)
        _taxRule = State(initialValue: jurisdiction?.taxRule ?? "")
        _isTracked = State(initialValue: jurisdiction?.isTracked ?? true)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Name
                        FormSection(title: "Name") {
                            TextField("Jurisdiction name", text: $name)
                                .padding(14)
                                .background(AppColors.surface)
                                .cornerRadius(10)
                                .foregroundColor(.white)
                        }

                        // Type
                        FormSection(title: "Type") {
                            HStack(spacing: 8) {
                                ForEach(JurisdictionType.allCases, id: \.self) { jType in
                                    Button {
                                        type = jType
                                    } label: {
                                        Text(jType.displayName)
                                            .font(.subheadline)
                                            .fontWeight(type == jType ? .semibold : .regular)
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 10)
                                            .foregroundColor(type == jType ? .white : .secondary)
                                            .background(type == jType ? AppColors.primary : AppColors.surface)
                                            .cornerRadius(10)
                                    }
                                }
                            }
                        }

                        // Color
                        FormSection(title: "Color") {
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 12) {
                                ForEach(colorPalette, id: \.self) { colorHex in
                                    Button {
                                        selectedColor = colorHex
                                    } label: {
                                        ZStack {
                                            Circle()
                                                .fill(Color(hex: colorHex))
                                                .frame(width: 40, height: 40)
                                            if selectedColor == colorHex {
                                                Image(systemName: "checkmark")
                                                    .font(.caption)
                                                    .fontWeight(.bold)
                                                    .foregroundColor(.white)
                                            }
                                        }
                                    }
                                }
                            }
                            .padding(14)
                            .background(AppColors.surface)
                            .cornerRadius(10)
                        }

                        // Day Limit
                        FormSection(title: "Day Limit") {
                            VStack(spacing: 10) {
                                HStack {
                                    Text("Threshold")
                                        .font(.subheadline)
                                        .foregroundColor(.white)
                                    Spacer()
                                    Text("\(dayLimit) days")
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(AppColors.primary)
                                }
                                Slider(value: Binding(
                                    get: { Double(dayLimit) },
                                    set: { dayLimit = Int($0) }
                                ), in: 1...366, step: 1)
                                .tint(Color(hex: selectedColor))

                                HStack {
                                    // Quick presets
                                    ForEach([30, 90, 183, 365, 366], id: \.self) { preset in
                                        Button("\(preset)") {
                                            dayLimit = preset
                                        }
                                        .font(.caption)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 5)
                                        .background(dayLimit == preset ? AppColors.primary.opacity(0.3) : AppColors.surface)
                                        .foregroundColor(dayLimit == preset ? AppColors.primary : .secondary)
                                        .cornerRadius(8)
                                    }
                                }
                            }
                            .padding(14)
                            .background(AppColors.surface)
                            .cornerRadius(10)
                        }

                        // Tax Rule
                        FormSection(title: "Tax Rule Description") {
                            TextField("e.g. 183-day rule", text: $taxRule)
                                .padding(14)
                                .background(AppColors.surface)
                                .cornerRadius(10)
                                .foregroundColor(.white)
                        }

                        // Tracked toggle
                        FormSection(title: "Tracking") {
                            Toggle(isOn: $isTracked) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Track this jurisdiction")
                                        .font(.subheadline)
                                        .foregroundColor(.white)
                                    Text("Show in dashboard and risk calculations")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            .tint(Color(hex: selectedColor))
                            .padding(14)
                            .background(AppColors.surface)
                            .cornerRadius(10)
                        }

                        // Preview
                        FormSection(title: "Preview") {
                            HStack(spacing: 12) {
                                Circle()
                                    .fill(Color(hex: selectedColor))
                                    .frame(width: 14, height: 14)
                                Text(name.isEmpty ? "Jurisdiction Name" : name)
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                Spacer()
                                Text("\(dayLimit)d limit")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(14)
                            .background(AppColors.surface)
                            .cornerRadius(10)
                        }

                        Spacer(minLength: 32)
                    }
                    .padding(16)
                }
            }
            .navigationTitle(isEditing ? "Edit Jurisdiction" : "Add Jurisdiction")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.secondary)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { save() }
                        .fontWeight(.semibold)
                        .foregroundColor(canSave ? AppColors.primary : .secondary)
                        .disabled(!canSave)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private func save() {
        let j = Jurisdiction(
            id: jurisdiction?.id ?? UUID().uuidString,
            name: name.trimmingCharacters(in: .whitespaces),
            type: type,
            color: selectedColor,
            dayLimit: dayLimit,
            taxRule: taxRule.trimmingCharacters(in: .whitespaces),
            isTracked: isTracked,
            isPrimary: jurisdiction?.isPrimary ?? false
        )
        if isEditing {
            store.updateJurisdiction(j)
        } else {
            store.addJurisdiction(j)
        }
        dismiss()
    }
}
