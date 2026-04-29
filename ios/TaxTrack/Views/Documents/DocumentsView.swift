import SwiftUI

// MARK: - DocumentsView
struct DocumentsView: View {
    @EnvironmentObject var store: DataStore
    @State private var selectedFilter: DocumentType? = nil
    @State private var showingAddDocument = false
    @State private var selectedDocument: Document?
    @State private var searchText = ""

    private var filteredDocuments: [Document] {
        var docs = store.documents
        if let filter = selectedFilter {
            docs = docs.filter { $0.type == filter }
        }
        if !searchText.isEmpty {
            docs = docs.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                $0.notes.localizedCaseInsensitiveContains(searchText)
            }
        }
        return docs.sorted { $0.date > $1.date }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Search
                    SearchBar(text: $searchText, placeholder: "Search documents...")
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)

                    // Filter chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            DocFilterChip(title: "All", icon: "doc.fill", isSelected: selectedFilter == nil, color: AppColors.primary)
                                .onTapGesture { selectedFilter = nil }
                            ForEach(DocumentType.allCases, id: \.self) { type in
                                DocFilterChip(
                                    title: type.displayName,
                                    icon: type.icon,
                                    isSelected: selectedFilter == type,
                                    color: typeColor(type)
                                )
                                .onTapGesture {
                                    selectedFilter = (selectedFilter == type) ? nil : type
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 10)
                    }

                    // Document list
                    if filteredDocuments.isEmpty {
                        EmptyDocumentsView(hasFilter: selectedFilter != nil || !searchText.isEmpty)
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 10) {
                                ForEach(filteredDocuments) { document in
                                    DocumentCard(document: document)
                                        .onTapGesture {
                                            selectedDocument = document
                                        }
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.bottom, 24)
                        }
                    }
                }
            }
            .navigationTitle("Documents")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddDocument = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundColor(AppColors.primary)
                    }
                }
            }
            .sheet(isPresented: $showingAddDocument) {
                AddDocumentView()
            }
            .sheet(item: $selectedDocument) { doc in
                DocumentDetailView(document: doc)
            }
        }
        .preferredColorScheme(.dark)
    }

    private func typeColor(_ type: DocumentType) -> Color {
        switch type {
        case .flight: return Color(hex: "#0A84FF")
        case .hotel: return Color(hex: "#FF9F0A")
        case .receipt: return Color(hex: "#30D158")
        case .photo: return Color(hex: "#BF5AF2")
        case .screenshot: return Color(hex: "#45B7D1")
        case .other: return Color(hex: "#98D8C8")
        }
    }
}

// MARK: - Document Card
struct DocumentCard: View {
    let document: Document

    var body: some View {
        HStack(spacing: 14) {
            // Thumbnail or icon
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(typeColor(document.type).opacity(0.15))
                    .frame(width: 56, height: 56)

                if let imageData = document.imageData, let uiImage = UIImage(data: imageData) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 56, height: 56)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                } else {
                    Image(systemName: document.type.icon)
                        .font(.system(size: 22))
                        .foregroundColor(typeColor(document.type))
                }
            }

            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(document.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    TypeBadge(type: document.type)
                    Text("•")
                        .foregroundColor(.secondary)
                        .font(.caption2)
                    Text(formatDate(document.date))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                if !document.notes.isEmpty {
                    Text(document.notes)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(12)
        .background(AppColors.surface)
        .cornerRadius(14)
    }

    private func typeColor(_ type: DocumentType) -> Color {
        switch type {
        case .flight: return Color(hex: "#0A84FF")
        case .hotel: return Color(hex: "#FF9F0A")
        case .receipt: return Color(hex: "#30D158")
        case .photo: return Color(hex: "#BF5AF2")
        case .screenshot: return Color(hex: "#45B7D1")
        case .other: return Color(hex: "#98D8C8")
        }
    }

    private func formatDate(_ str: String) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        if let d = f.date(from: str) {
            f.dateFormat = "MMM d, yyyy"
            return f.string(from: d)
        }
        return str
    }
}

struct TypeBadge: View {
    let type: DocumentType

    var color: Color {
        switch type {
        case .flight: return Color(hex: "#0A84FF")
        case .hotel: return Color(hex: "#FF9F0A")
        case .receipt: return Color(hex: "#30D158")
        case .photo: return Color(hex: "#BF5AF2")
        case .screenshot: return Color(hex: "#45B7D1")
        case .other: return Color(hex: "#98D8C8")
        }
    }

    var body: some View {
        Text(type.displayName)
            .font(.caption2)
            .foregroundColor(color)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(color.opacity(0.15))
            .cornerRadius(5)
    }
}

// MARK: - Empty State
struct EmptyDocumentsView: View {
    let hasFilter: Bool

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: hasFilter ? "magnifyingglass" : "doc.badge.plus")
                .font(.system(size: 52))
                .foregroundColor(.secondary)
            Text(hasFilter ? "No matching documents" : "No Documents Yet")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(.white)
            Text(hasFilter
                 ? "Try adjusting your filters or search"
                 : "Add boarding passes, hotel receipts, and other supporting documents to build your evidence vault.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Spacer()
        }
    }
}

// MARK: - Search Bar
struct SearchBar: View {
    @Binding var text: String
    let placeholder: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
                .font(.subheadline)
            TextField(placeholder, text: $text)
                .foregroundColor(.white)
                .font(.subheadline)
            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(10)
        .background(AppColors.surface)
        .cornerRadius(10)
    }
}

// MARK: - Doc Filter Chip
struct DocFilterChip: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let color: Color

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.caption2)
            Text(title)
                .font(.caption)
                .fontWeight(isSelected ? .semibold : .regular)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .foregroundColor(isSelected ? color : .secondary)
        .background(isSelected ? color.opacity(0.2) : AppColors.surface)
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(isSelected ? color.opacity(0.5) : Color.clear, lineWidth: 1)
        )
    }
}

// MARK: - Document Detail View
struct DocumentDetailView: View {
    @EnvironmentObject var store: DataStore
    let document: Document
    @Environment(\.dismiss) var dismiss
    @State private var showingDeleteConfirm = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Image
                        if let imageData = document.imageData, let uiImage = UIImage(data: imageData) {
                            Image(uiImage: uiImage)
                                .resizable()
                                .scaledToFit()
                                .cornerRadius(14)
                                .padding(.horizontal, 16)
                        } else {
                            ZStack {
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(AppColors.surface)
                                    .frame(height: 160)
                                Image(systemName: document.type.icon)
                                    .font(.system(size: 52))
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal, 16)
                        }

                        // Details
                        VStack(spacing: 14) {
                            DetailRow(icon: document.type.icon, label: "Type", value: document.type.displayName)
                            DetailRow(icon: "calendar", label: "Date", value: formatDate(document.date))
                            if !document.notes.isEmpty {
                                DetailRow(icon: "note.text", label: "Notes", value: document.notes)
                            }
                            if !document.extractedData.isEmpty {
                                ForEach(Array(document.extractedData.sorted(by: { $0.key < $1.key })), id: \.key) { key, value in
                                    DetailRow(icon: "tag", label: key.capitalized, value: value)
                                }
                            }
                        }
                        .padding(16)
                        .background(AppColors.surface)
                        .cornerRadius(14)
                        .padding(.horizontal, 16)

                        // Delete button
                        Button(role: .destructive) {
                            showingDeleteConfirm = true
                        } label: {
                            Label("Delete Document", systemImage: "trash")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(AppColors.riskHigh.opacity(0.15))
                                .foregroundColor(AppColors.riskHigh)
                                .cornerRadius(14)
                                .padding(.horizontal, 16)
                        }

                        Spacer(minLength: 32)
                    }
                    .padding(.top, 16)
                }
            }
            .navigationTitle(document.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundColor(.secondary)
                }
            }
            .confirmationDialog("Delete Document", isPresented: $showingDeleteConfirm, titleVisibility: .visible) {
                Button("Delete", role: .destructive) {
                    store.removeDocument(id: document.id)
                    dismiss()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will permanently delete this document.")
            }
        }
        .preferredColorScheme(.dark)
    }

    private func formatDate(_ str: String) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        if let d = f.date(from: str) {
            f.dateFormat = "MMM d, yyyy"
            return f.string(from: d)
        }
        return str
    }
}
