package com.taxtrack.app.ui.settings

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.taxtrack.app.ui.theme.*
import com.taxtrack.app.viewmodels.AppViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(viewModel: AppViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current

    var showClearDataDialog by remember { mutableStateOf(false) }
    var showCsvImportDialog by remember { mutableStateOf(false) }
    var showJurisdictionManager by remember { mutableStateOf(false) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(snackbarMessage) {
        snackbarMessage?.let {
            snackbarHostState.showSnackbar(it)
            snackbarMessage = null
        }
    }

    // CSV import file picker
    val csvLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            try {
                val inputStream = context.contentResolver.openInputStream(it)
                val csvContent = inputStream?.bufferedReader()?.readText() ?: ""
                inputStream?.close()
                viewModel.importFromCsv(csvContent) { count ->
                    snackbarMessage = "Imported $count entries successfully"
                }
            } catch (e: Exception) {
                snackbarMessage = "Failed to import CSV: ${e.message}"
            }
        }
    }

    // JSON restore file picker
    val jsonRestoreLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            try {
                val inputStream = context.contentResolver.openInputStream(it)
                val jsonContent = inputStream?.bufferedReader()?.readText() ?: ""
                inputStream?.close()
                viewModel.importFromJson(jsonContent) { success ->
                    snackbarMessage = if (success) "Backup restored successfully" else "Failed to restore backup"
                }
            } catch (e: Exception) {
                snackbarMessage = "Failed to restore: ${e.message}"
            }
        }
    }

    Scaffold(
        containerColor = Background,
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            item {
                Text(
                    text = "Settings",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
                )
            }

            // Profile section
            item {
                SettingsSection(title = "Profile") {
                    ProfileCard(
                        name = state.profile.name,
                        primaryJurisdiction = state.jurisdictions.find { it.id == state.profile.primaryJurisdictionId }?.name ?: "Not set"
                    )
                }
            }

            // Tracking section
            item {
                SettingsSection(title = "Location Tracking") {
                    SettingsSwitchItem(
                        icon = Icons.Filled.LocationOn,
                        iconColor = Primary,
                        title = "Background Tracking",
                        subtitle = if (state.isTrackingActive) "Actively tracking your location" else "Tap to start automatic tracking",
                        checked = state.isTrackingActive,
                        onToggle = {
                            if (state.isTrackingActive) viewModel.stopLocationTracking()
                            else viewModel.startLocationTracking()
                        }
                    )

                    HorizontalDivider(color = Divider, modifier = Modifier.padding(horizontal = 16.dp))

                    SettingsItem(
                        icon = Icons.Filled.BatteryChargingFull,
                        iconColor = Accent,
                        title = "Battery Optimization",
                        subtitle = "Disable battery optimization for reliable tracking",
                        onClick = { viewModel.requestBatteryOptimizationExemption() }
                    )
                }
            }

            // Jurisdictions section
            item {
                SettingsSection(title = "Jurisdictions") {
                    SettingsItem(
                        icon = Icons.Filled.Public,
                        iconColor = Secondary,
                        title = "Manage Jurisdictions",
                        subtitle = "${state.jurisdictions.count { it.isTracked || it.isPrimary }} active jurisdictions",
                        onClick = { showJurisdictionManager = true }
                    )
                }
            }

            // Data management section
            item {
                SettingsSection(title = "Data Management") {
                    SettingsItem(
                        icon = Icons.Filled.FileUpload,
                        iconColor = Primary,
                        title = "Import CSV",
                        subtitle = "Import from Monaeo or compatible CSV",
                        onClick = { csvLauncher.launch("text/*") }
                    )

                    HorizontalDivider(color = Divider, modifier = Modifier.padding(horizontal = 16.dp))

                    SettingsItem(
                        icon = Icons.Filled.FileDownload,
                        iconColor = Secondary,
                        title = "Export Backup",
                        subtitle = "Save all data as JSON",
                        onClick = {
                            val json = viewModel.exportToJson()
                            val intent = Intent(Intent.ACTION_SEND).apply {
                                type = "application/json"
                                val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
                                val tempFile = java.io.File(context.cacheDir, "taxtrack_backup_$timestamp.json")
                                tempFile.writeText(json)
                                val uri = androidx.core.content.FileProvider.getUriForFile(
                                    context, "${context.packageName}.fileprovider", tempFile
                                )
                                putExtra(Intent.EXTRA_STREAM, uri)
                                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            }
                            context.startActivity(Intent.createChooser(intent, "Export Backup"))
                        }
                    )

                    HorizontalDivider(color = Divider, modifier = Modifier.padding(horizontal = 16.dp))

                    SettingsItem(
                        icon = Icons.Filled.Restore,
                        iconColor = Accent,
                        title = "Restore Backup",
                        subtitle = "Import from JSON backup file",
                        onClick = { jsonRestoreLauncher.launch("application/json") }
                    )
                }
            }

            // Stats
            item {
                SettingsSection(title = "Statistics") {
                    StatsRow(
                        entries = state.entries.size,
                        documents = state.documents.size,
                        jurisdictions = state.jurisdictions.count { it.isTracked || it.isPrimary }
                    )
                }
            }

            // Danger zone
            item {
                SettingsSection(title = "Danger Zone") {
                    SettingsItem(
                        icon = Icons.Filled.DeleteForever,
                        iconColor = RiskHigh,
                        title = "Clear All Data",
                        subtitle = "Permanently delete all location history and documents",
                        titleColor = RiskHigh,
                        onClick = { showClearDataDialog = true }
                    )
                }
            }

            // App info
            item {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("TaxTrack v1.0.0", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    Text("com.taxtrack.app", style = MaterialTheme.typography.bodySmall, color = TextTertiary)
                }
            }
        }
    }

    // Dialogs
    if (showClearDataDialog) {
        AlertDialog(
            onDismissRequest = { showClearDataDialog = false },
            title = { Text("Clear All Data", color = RiskHigh, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "This will permanently delete all location entries, documents, and settings. This action cannot be undone.",
                    color = TextPrimary
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.clearAllData()
                        showClearDataDialog = false
                        snackbarMessage = "All data cleared"
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RiskHigh)
                ) { Text("Clear All Data") }
            },
            dismissButton = {
                TextButton(onClick = { showClearDataDialog = false }) { Text("Cancel") }
            },
            containerColor = Surface
        )
    }

    if (showJurisdictionManager) {
        JurisdictionManagerSheet(
            jurisdictions = state.jurisdictions,
            onToggle = { viewModel.toggleJurisdictionTracking(it) },
            onSetPrimary = { viewModel.setPrimaryJurisdiction(it) },
            onDismiss = { showJurisdictionManager = false }
        )
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
        Text(
            text = title.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = TextSecondary,
            modifier = Modifier.padding(bottom = 8.dp, start = 4.dp)
        )
        Card(
            colors = CardDefaults.cardColors(containerColor = Surface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(content = content)
        }
    }
}

@Composable
private fun ProfileCard(name: String, primaryJurisdiction: String) {
    Row(
        modifier = Modifier.padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(Primary.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = if (name.isNotBlank()) name.first().uppercase() else "T",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Primary
            )
        }
        Column {
            Text(
                text = if (name.isNotBlank()) name else "TaxTrack User",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Text(
                text = "Primary: $primaryJurisdiction",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun SettingsItem(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String,
    titleColor: Color = TextPrimary,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(iconColor.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(18.dp))
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium, color = titleColor)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
        }

        Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = TextTertiary, modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun SettingsSwitchItem(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String,
    checked: Boolean,
    onToggle: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(iconColor.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(18.dp))
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium, color = TextPrimary)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
        }

        Switch(
            checked = checked,
            onCheckedChange = { onToggle() },
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = Primary
            )
        )
    }
}

@Composable
private fun StatsRow(entries: Int, documents: Int, jurisdictions: Int) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        horizontalArrangement = Arrangement.SpaceAround
    ) {
        StatItem(entries.toString(), "Entries")
        VerticalDivider(modifier = Modifier.height(40.dp), color = Divider)
        StatItem(documents.toString(), "Documents")
        VerticalDivider(modifier = Modifier.height(40.dp), color = Divider)
        StatItem(jurisdictions.toString(), "Jurisdictions")
    }
}

@Composable
private fun StatItem(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = TextPrimary)
        Text(label, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun JurisdictionManagerSheet(
    jurisdictions: List<com.taxtrack.app.data.models.Jurisdiction>,
    onToggle: (String) -> Unit,
    onSetPrimary: (String) -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Surface,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp)
        ) {
            Text(
                "Manage Jurisdictions",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            jurisdictions.forEach { jurisdiction ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(colorFromHex(jurisdiction.color).copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Filled.LocationOn,
                            contentDescription = null,
                            tint = colorFromHex(jurisdiction.color),
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                jurisdiction.name,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                color = TextPrimary
                            )
                            if (jurisdiction.isPrimary) {
                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = Primary.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        "Primary",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Primary,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                        Text(
                            "${jurisdiction.dayLimit} day limit",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }

                    if (!jurisdiction.isPrimary) {
                        TextButton(
                            onClick = { onSetPrimary(jurisdiction.id) },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("Set Primary", style = MaterialTheme.typography.labelSmall, color = Primary)
                        }
                    }

                    Switch(
                        checked = jurisdiction.isTracked || jurisdiction.isPrimary,
                        onCheckedChange = { if (!jurisdiction.isPrimary) onToggle(jurisdiction.id) },
                        enabled = !jurisdiction.isPrimary,
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = colorFromHex(jurisdiction.color)
                        )
                    )
                }

                HorizontalDivider(color = Divider)
            }
        }
    }
}
