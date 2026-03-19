import SwiftUI
import PhotosUI

// MARK: - AddDocumentView
struct AddDocumentView: View {
    @EnvironmentObject var store: DataStore
    @Environment(\.dismiss) var dismiss

    @State private var title: String = ""
    @State private var documentType: DocumentType = .other
    @State private var selectedDate: String = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }()
    @State private var notes: String = ""
    @State private var selectedImage: UIImage? = nil
    @State private var showingImageSource = false
    @State private var showingCamera = false
    @State private var showingPhotoLibrary = false
    @State private var photoPickerItem: PhotosPickerItem? = nil
    @State private var isLoadingImage = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Image picker area
                        imagePickerSection

                        // Document type
                        FormSection(title: "Document Type") {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(DocumentType.allCases, id: \.self) { type in
                                        DocumentTypeChip(type: type, isSelected: documentType == type)
                                            .onTapGesture { documentType = type }
                                    }
                                }
                            }
                        }

                        // Title
                        FormSection(title: "Title") {
                            TextField("Document title", text: $title)
                                .padding(14)
                                .background(AppColors.surface)
                                .cornerRadius(10)
                                .foregroundColor(.white)
                        }

                        // Date
                        FormSection(title: "Date") {
                            DatePickerField(dateString: $selectedDate)
                        }

                        // Notes
                        FormSection(title: "Notes (Optional)") {
                            TextEditor(text: $notes)
                                .frame(minHeight: 80)
                                .padding(10)
                                .background(AppColors.surface)
                                .cornerRadius(10)
                                .foregroundColor(.white)
                                .scrollContentBackground(.hidden)
                        }

                        Spacer(minLength: 32)
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Add Document")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.secondary)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { saveDocument() }
                        .fontWeight(.semibold)
                        .foregroundColor(canSave ? AppColors.primary : .secondary)
                        .disabled(!canSave)
                }
            }
            .confirmationDialog("Add Image", isPresented: $showingImageSource) {
                Button("Camera") { showingCamera = true }
                Button("Photo Library") { showingPhotoLibrary = true }
                Button("Cancel", role: .cancel) {}
            }
            .sheet(isPresented: $showingCamera) {
                CameraView(image: $selectedImage)
            }
            .photosPicker(
                isPresented: $showingPhotoLibrary,
                selection: $photoPickerItem,
                matching: .images
            )
            .onChange(of: photoPickerItem) { _, newItem in
                loadPhoto(from: newItem)
            }
            .onAppear {
                // Auto-set title based on type
                if title.isEmpty {
                    updateDefaultTitle()
                }
            }
            .onChange(of: documentType) { _, _ in
                if title.isEmpty || isDefaultTitle(title) {
                    updateDefaultTitle()
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Image Picker Section
    private var imagePickerSection: some View {
        VStack(spacing: 0) {
            if let image = selectedImage {
                ZStack(alignment: .topTrailing) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 200)
                        .cornerRadius(14)

                    Button {
                        selectedImage = nil
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.white)
                            .background(Circle().fill(Color.black.opacity(0.5)))
                    }
                    .padding(8)
                }

                Button {
                    showingImageSource = true
                } label: {
                    Text("Change Image")
                        .font(.caption)
                        .foregroundColor(AppColors.primary)
                        .padding(.top, 8)
                }
            } else {
                Button {
                    showingImageSource = true
                } label: {
                    VStack(spacing: 12) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.secondary)
                        Text("Add Image")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Text("Camera or Photo Library")
                            .font(.caption)
                            .foregroundColor(Color.secondary.opacity(0.7))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(30)
                    .background(AppColors.surface)
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [6]))
                            .foregroundColor(Color.gray.opacity(0.4))
                    )
                }
            }
        }
    }

    // MARK: - Helpers
    var canSave: Bool {
        !title.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private func updateDefaultTitle() {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        let dateStr: String
        if let d = DateFormatter().date(from: selectedDate) {
            dateStr = formatter.string(from: d)
        } else {
            dateStr = selectedDate
        }
        title = "\(documentType.displayName) - \(dateStr)"
    }

    private func isDefaultTitle(_ t: String) -> Bool {
        DocumentType.allCases.contains { t.hasPrefix($0.displayName + " - ") }
    }

    private func loadPhoto(from item: PhotosPickerItem?) {
        guard let item = item else { return }
        isLoadingImage = true
        Task {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                await MainActor.run {
                    selectedImage = image
                    isLoadingImage = false
                }
            } else {
                await MainActor.run {
                    isLoadingImage = false
                }
            }
        }
    }

    private func saveDocument() {
        let imageData: Data?
        if let img = selectedImage {
            imageData = img.jpegData(compressionQuality: 0.7)
        } else {
            imageData = nil
        }

        let document = Document(
            type: documentType,
            title: title.trimmingCharacters(in: .whitespaces),
            date: selectedDate,
            imageData: imageData,
            notes: notes.trimmingCharacters(in: .whitespaces)
        )
        store.addDocument(document)
        dismiss()
    }
}

// MARK: - Document Type Chip
struct DocumentTypeChip: View {
    let type: DocumentType
    let isSelected: Bool

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
        HStack(spacing: 6) {
            Image(systemName: type.icon)
                .font(.caption)
            Text(type.displayName)
                .font(.caption)
                .fontWeight(isSelected ? .semibold : .regular)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .foregroundColor(isSelected ? color : .secondary)
        .background(isSelected ? color.opacity(0.2) : AppColors.surface)
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(isSelected ? color.opacity(0.5) : Color.clear, lineWidth: 1)
        )
    }
}

// MARK: - Camera View
struct CameraView: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraView

        init(_ parent: CameraView) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}
