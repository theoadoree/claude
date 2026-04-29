package com.taxtrack.app.ui.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.taxtrack.app.ui.theme.*
import com.taxtrack.app.viewmodels.AppViewModel

@Composable
fun MapScreen(viewModel: AppViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    // Filter entries with valid coordinates
    val entriesWithCoords = remember(state.entries) {
        state.entries.filter { it.latitude != 0.0 || it.longitude != 0.0 }
    }

    // Default camera position (US center)
    val defaultPosition = LatLng(39.5, -98.35)
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(
            if (entriesWithCoords.isNotEmpty()) {
                LatLng(entriesWithCoords.first().latitude, entriesWithCoords.first().longitude)
            } else defaultPosition,
            if (entriesWithCoords.isNotEmpty()) 8f else 4f
        )
    }

    var selectedEntry by remember { mutableStateOf<com.taxtrack.app.data.models.LocationEntry?>(null) }

    Box(modifier = Modifier.fillMaxSize()) {
        if (entriesWithCoords.isEmpty()) {
            EmptyMapPlaceholder()
        } else {
            GoogleMap(
                modifier = Modifier.fillMaxSize(),
                cameraPositionState = cameraPositionState,
                properties = MapProperties(
                    mapType = MapType.NORMAL,
                    isMyLocationEnabled = false
                ),
                uiSettings = MapUiSettings(
                    zoomControlsEnabled = true,
                    compassEnabled = true,
                    mapToolbarEnabled = false
                )
            ) {
                entriesWithCoords.forEach { entry ->
                    val jurisdiction = state.jurisdictions.find { it.id == entry.jurisdictionId }
                    val markerColor = jurisdiction?.let { colorFromHex(it.color) } ?: Primary

                    Marker(
                        state = MarkerState(position = LatLng(entry.latitude, entry.longitude)),
                        title = jurisdiction?.name ?: entry.jurisdictionId,
                        snippet = buildString {
                            if (entry.city.isNotBlank()) append(entry.city)
                            append(" • ")
                            append(entry.date)
                        },
                        onClick = { marker ->
                            selectedEntry = entry
                            false
                        }
                    )
                }
            }
        }

        // Map header overlay
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .align(Alignment.TopCenter),
            colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.95f)),
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(Icons.Filled.Map, contentDescription = null, tint = Primary, modifier = Modifier.size(20.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Location History",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                    Text(
                        text = "${entriesWithCoords.size} locations with GPS coordinates",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
            }
        }

        // Selected entry detail card
        selectedEntry?.let { entry ->
            val jurisdiction = state.jurisdictions.find { it.id == entry.jurisdictionId }
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .align(Alignment.BottomCenter),
                colors = CardDefaults.cardColors(containerColor = Surface),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                jurisdiction?.let { colorFromHex(it.color) }?.copy(alpha = 0.2f) ?: Primary.copy(alpha = 0.2f)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Filled.LocationOn,
                            contentDescription = null,
                            tint = jurisdiction?.let { colorFromHex(it.color) } ?: Primary,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = jurisdiction?.name ?: entry.jurisdictionId,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )
                        val location = buildString {
                            if (entry.city.isNotBlank()) append(entry.city)
                            if (entry.state.isNotBlank()) { if (isNotEmpty()) append(", "); append(entry.state) }
                        }
                        if (location.isNotBlank()) {
                            Text(location, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                        }
                        Text(entry.date, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }

                    IconButton(onClick = { selectedEntry = null }) {
                        Icon(Icons.Filled.Close, contentDescription = "Close", tint = TextSecondary)
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyMapPlaceholder() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(SurfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Filled.Map,
                    contentDescription = null,
                    tint = TextSecondary,
                    modifier = Modifier.size(56.dp)
                )
            }

            Text(
                "No GPS Data Yet",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Text(
                "Enable background location tracking to automatically record GPS coordinates, or add location entries manually.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )

            Card(
                colors = CardDefaults.cardColors(containerColor = Surface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    MapInfoRow(Icons.Filled.LocationOn, "Auto-tracking logs GPS with each check-in", Primary)
                    MapInfoRow(Icons.Filled.Edit, "Manual entries without GPS won't appear on map", TextSecondary)
                    MapInfoRow(Icons.Filled.FileUpload, "CSV imports with lat/long will show as markers", Secondary)
                }
            }
        }
    }
}

@Composable
private fun MapInfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String,
    iconColor: Color
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(16.dp))
        Text(text, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
    }
}
