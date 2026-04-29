package com.taxtrack.app.ui.documents

import android.Manifest
import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.taxtrack.app.data.models.TaxDocument
import com.taxtrack.app.ui.theme.*
import com.taxtrack.app.viewmodels.AppViewModel
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun DocumentsScreen(viewModel: AppViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current

    var selectedFilter by remember { mutableStateOf("all") }
    var showAddSheet by remember { mutableStateOf(false) }
    var showAddOptions by remember { mutableStateOf(false) }
    var capturedImagePath by remember { mutableStateOf<String?>(null) }
    var tempCameraUri by remember { mutableStateOf<Uri?>(null) }

    val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)

    // Camera launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success ->
        if (success && capturedImagePath != null) {
            showAddSheet = true
        }
    }

    // Gallery launcher
    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            capturedImagePath = it.toString()
            showAddSheet = true
        }
    }

    val documentFilters = listOf(
        "all" to "All",
        "flight" to "Flights",
        "hotel" to "Hotels",
        "receipt" to "Receipts",
        "photo" to "Photos",
        "other" to "Other"
    )

    val filteredDocs = if (selectedFilter == "all") {
        state.documents
    } else {
        state.documents.filter { it.type == selectedFilter }
    }

    Scaffold(
        containerColor = Background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddOptions = true },
                containerColor = Primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Add document")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Header
            Text(
                text = "Evidence Vault",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
            )

            // Stats row
            DocumentStatsRow(documents = state.documents)

            // Filter chips
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(documentFilters) { (filter, label) ->
                    val count = if (filter == "all") state.documents.size
                    else state.documents.count { it.type == filter }

                    FilterChip(
                        selected = selectedFilter == filter,
                        onClick = { selectedFilter = filter },
                        label = { Text("$label ($count)") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Primary.copy(alpha = 0.2f),
                            selectedLabelColor = Primary
                        )
                    )
                }
            }

            // Document list
            if (filteredDocs.isEmpty()) {
                EmptyDocumentsPlaceholder(
                    filter = selectedFilter,
                    onAdd = { showAddOptions = true }
                )
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredDocs, key = { it.id }) { document ->
                        DocumentCard(
                            document = document,
                            onDelete = { viewModel.deleteDocument(document.id) }
                        )
                    }
                }
            }
        }
    }

    // Add options menu
    if (showAddOptions) {
        ModalBottomSheet(
            onDismissRequest = { showAddOptions = false },
            containerColor = Surface,
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    "Add Document",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                AddOptionItem(
                    icon = Icons.Filled.CameraAlt,
                    title = "Take Photo",
                    subtitle = "Use camera to capture document",
                    color = Primary
                ) {
                    showAddOptions = false
                    if (cameraPermission.status.isGranted) {
                        val photoFile = createImageFile(context)
                        capturedImagePath = photoFile.absolutePath
                        val uri = FileProvider.getUriForFile(
                            context, "${context.packageName}.fileprovider", photoFile
                        )
                        tempCameraUri = uri
                        cameraLauncher.launch(uri)
                    } else {
                        cameraPermission.launchPermissionRequest()
                    }
                }

                AddOptionItem(
                    icon = Icons.Filled.PhotoLibrary,
                    title = "Choose from Gallery",
                    subtitle = "Select existing photo or document",
                    color = Secondary
                ) {
                    showAddOptions = false
                    galleryLauncher.launch("image/*")
                }

                AddOptionItem(
                    icon = Icons.Filled.NoteAdd,
                    title = "Add Note",
                    subtitle = "Create a text-only document entry",
                    color = Accent
                ) {
                    showAddOptions = false
                    capturedImagePath = null
                    showAddSheet = true
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }

    // Add document form sheet
    if (showAddSheet) {
        AddDocumentSheet(
            imagePath = capturedImagePath,
            onDismiss = { showAddSheet = false; capturedImagePath = null },
            onSave = { type, title, date, notes ->
                viewModel.addDocument(
                    type = type,
                    title = title,
                    date = date,
                    imagePath = capturedImagePath,
                    notes = notes
                )
                showAddSheet = false
                capturedImagePath = null
            }
        )
    }
}

@Composable
private fun DocumentStatsRow(documents: List<TaxDocument>) {
    val stats = listOf(
        "flight" to documents.count { it.type == "flight" },
        "hotel" to documents.count { it.type == "hotel" },
        "receipt" to documents.count { it.type == "receipt" },
        "photo" to documents.count { it.type == "photo" }
    )

    LazyRow(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(stats) { (type, count) ->
            val (icon, color, label) = documentTypeInfo(type)
            Card(
                colors = CardDefaults.cardColors(containerColor = Surface),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
                    Text("$count $label", style = MaterialTheme.typography.labelMedium, color = TextSecondary)
                }
            }
        }
    }
}

@Composable
private fun DocumentCard(
    document: TaxDocument,
    onDelete: () -> Unit
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }
    val (icon, color, _) = documentTypeInfo(document.type)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                if (document.imagePath != null) {
                    Icon(Icons.Filled.Image, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
                } else {
                    Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    document.title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(shape = RoundedCornerShape(4.dp), color = color.copy(alpha = 0.15f)) {
                        Text(
                            document.type.replaceFirstChar { it.uppercase() },
                            style = MaterialTheme.typography.labelSmall,
                            color = color,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                    Text(document.date, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                }
                if (document.notes.isNotBlank()) {
                    Text(
                        document.notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        maxLines = 1
                    )
                }
            }

            IconButton(
                onClick = { showDeleteConfirm = true },
                modifier = Modifier.size(32.dp)
            ) {
                Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = RiskHigh.copy(alpha = 0.7f), modifier = Modifier.size(18.dp))
            }
        }
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete Document") },
            text = { Text("Remove \"${document.title}\" from your evidence vault?") },
            confirmButton = {
                TextButton(onClick = { showDeleteConfirm = false; onDelete() }) {
                    Text("Delete", color = RiskHigh)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) { Text("Cancel") }
            },
            containerColor = Surface
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddDocumentSheet(
    imagePath: String?,
    onDismiss: () -> Unit,
    onSave: (String, String, String, String) -> Unit
) {
    var docType by remember { mutableStateOf("other") }
    var title by remember { mutableStateOf("") }
    var date by remember { mutableStateOf(SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())) }
    var notes by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Surface,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                "Add Document",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            if (imagePath != null) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Filled.Image, contentDescription = null, tint = Secondary, modifier = Modifier.size(20.dp))
                    Text("Image attached", style = MaterialTheme.typography.bodySmall, color = Secondary)
                }
            }

            // Type selector
            Text("Document Type", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                val types = listOf("flight", "hotel", "receipt", "photo", "other")
                items(types) { type ->
                    val (icon, color, label) = documentTypeInfo(type)
                    FilterChip(
                        selected = docType == type,
                        onClick = { docType = type },
                        label = { Text(label) },
                        leadingIcon = { Icon(icon, contentDescription = null, modifier = Modifier.size(14.dp)) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = color.copy(alpha = 0.2f),
                            selectedLabelColor = color,
                            selectedLeadingIconColor = color
                        )
                    )
                }
            }

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Title") },
                placeholder = { Text("e.g. AA Flight NYC-MIA") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = Divider,
                    focusedLabelColor = Primary,
                    cursorColor = Primary
                ),
                singleLine = true
            )

            OutlinedTextField(
                value = date,
                onValueChange = { date = it },
                label = { Text("Date (YYYY-MM-DD)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = Divider,
                    focusedLabelColor = Primary,
                    cursorColor = Primary
                ),
                singleLine = true
            )

            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = Divider,
                    focusedLabelColor = Primary,
                    cursorColor = Primary
                ),
                minLines = 2,
                maxLines = 4
            )

            Button(
                onClick = { onSave(docType, title.ifBlank { "Document" }, date, notes) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Save Document", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun AddOptionItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    color: Color,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(color.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(22.dp))
        }
        Column {
            Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = TextPrimary)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
        }
    }
}

@Composable
private fun EmptyDocumentsPlaceholder(filter: String, onAdd: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                Icons.Filled.FolderOpen,
                contentDescription = null,
                tint = TextSecondary,
                modifier = Modifier.size(56.dp)
            )
            Text(
                if (filter == "all") "Evidence Vault is Empty" else "No ${filter.replaceFirstChar { it.uppercase() }} Documents",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                "Store boarding passes, hotel receipts, and photos to verify your location and reduce audit risk.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            Button(
                onClick = onAdd,
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Add Document")
            }
        }
    }
}

private fun createImageFile(context: Context): File {
    val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
    val storageDir = File(context.filesDir, "images").also { it.mkdirs() }
    return File.createTempFile("JPEG_${timeStamp}_", ".jpg", storageDir)
}

@Composable
private fun documentTypeInfo(type: String): Triple<androidx.compose.ui.graphics.vector.ImageVector, Color, String> {
    return when (type) {
        "flight" -> Triple(Icons.Filled.Flight, Color(0xFF0A84FF), "Flight")
        "hotel" -> Triple(Icons.Filled.Hotel, Color(0xFFBF5AF2), "Hotel")
        "receipt" -> Triple(Icons.Filled.Receipt, Color(0xFFFF9F0A), "Receipt")
        "photo" -> Triple(Icons.Filled.Photo, Color(0xFF30D158), "Photo")
        else -> Triple(Icons.Filled.Description, Color(0xFF8E8E93), "Other")
    }
}
