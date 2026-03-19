package com.taxtrack.app.ui.calendar

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.taxtrack.app.ui.theme.*
import com.taxtrack.app.viewmodels.AppViewModel
import java.util.Calendar
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScreen(
    viewModel: AppViewModel,
    onAddEntry: (String) -> Unit
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val today = Calendar.getInstance()
    var displayYear by remember { mutableIntStateOf(today.get(Calendar.YEAR)) }
    var displayMonth by remember { mutableIntStateOf(today.get(Calendar.MONTH) + 1) }
    var selectedDate by remember { mutableStateOf<String?>(null) }
    var showDaySheet by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        // Header
        CalendarHeader(
            year = displayYear,
            month = displayMonth,
            onPrevMonth = {
                if (displayMonth == 1) { displayYear--; displayMonth = 12 }
                else displayMonth--
            },
            onNextMonth = {
                if (displayMonth == 12) { displayYear++; displayMonth = 1 }
                else displayMonth++
            }
        )

        // Day-of-week labels
        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp)) {
            listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat").forEach { day ->
                Text(
                    text = day,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Calendar grid
        val monthEntries = viewModel.getEntriesForMonth(displayYear, displayMonth)
        val todayStr = String.format("%04d-%02d-%02d",
            today.get(Calendar.YEAR), today.get(Calendar.MONTH) + 1, today.get(Calendar.DAY_OF_MONTH))

        CalendarGrid(
            year = displayYear,
            month = displayMonth,
            entriesByDate = monthEntries,
            jurisdictions = state.jurisdictions,
            todayStr = todayStr,
            selectedDate = selectedDate,
            onDayClick = { date ->
                selectedDate = date
                showDaySheet = true
            }
        )

        // Legend
        CalendarLegend(jurisdictions = state.jurisdictions.filter { it.isTracked || it.isPrimary })
    }

    // Day detail bottom sheet
    if (showDaySheet && selectedDate != null) {
        val date = selectedDate!!
        val dayEntries = viewModel.getEntriesForDate(date)

        ModalBottomSheet(
            onDismissRequest = { showDaySheet = false; selectedDate = null },
            containerColor = Surface,
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
        ) {
            DayDetailSheet(
                date = date,
                entries = dayEntries,
                jurisdictions = state.jurisdictions,
                onAddEntry = {
                    showDaySheet = false
                    onAddEntry(date)
                },
                onDeleteEntry = { entryId ->
                    viewModel.deleteLocationEntry(entryId)
                },
                onVerifyEntry = { entryId ->
                    viewModel.verifyEntry(entryId)
                }
            )
        }
    }
}

@Composable
private fun CalendarHeader(
    year: Int,
    month: Int,
    onPrevMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    val monthName = java.text.DateFormatSymbols(Locale.getDefault()).months[month - 1]

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onPrevMonth) {
            Icon(Icons.Filled.ChevronLeft, contentDescription = "Previous month", tint = TextPrimary)
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = monthName,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = year.toString(),
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }

        IconButton(onClick = onNextMonth) {
            Icon(Icons.Filled.ChevronRight, contentDescription = "Next month", tint = TextPrimary)
        }
    }
}

@Composable
private fun CalendarGrid(
    year: Int,
    month: Int,
    entriesByDate: Map<String, List<com.taxtrack.app.data.models.LocationEntry>>,
    jurisdictions: List<com.taxtrack.app.data.models.Jurisdiction>,
    todayStr: String,
    selectedDate: String?,
    onDayClick: (String) -> Unit
) {
    val cal = Calendar.getInstance().apply {
        set(year, month - 1, 1)
    }
    val firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1 // 0=Sun, 6=Sat
    val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)

    val cells = mutableListOf<Int?>()
    repeat(firstDayOfWeek) { cells.add(null) }
    for (d in 1..daysInMonth) cells.add(d)
    while (cells.size % 7 != 0) cells.add(null)

    val weeks = cells.chunked(7)

    Column(modifier = Modifier.padding(horizontal = 12.dp)) {
        weeks.forEach { week ->
            Row(modifier = Modifier.fillMaxWidth()) {
                week.forEach { day ->
                    if (day == null) {
                        Box(modifier = Modifier.weight(1f).aspectRatio(1f))
                    } else {
                        val dateStr = String.format("%04d-%02d-%02d", year, month, day)
                        val dayEntries = entriesByDate[dateStr] ?: emptyList()
                        val isToday = dateStr == todayStr
                        val isSelected = dateStr == selectedDate

                        // Determine jurisdiction color for this day
                        val dominantEntry = dayEntries.firstOrNull()
                        val jurisdiction = dominantEntry?.let { e ->
                            jurisdictions.find { it.id == e.jurisdictionId }
                        }
                        val dayColor = jurisdiction?.let { colorFromHex(it.color) }

                        CalendarDay(
                            day = day,
                            hasEntries = dayEntries.isNotEmpty(),
                            isToday = isToday,
                            isSelected = isSelected,
                            jurisdictionColor = dayColor,
                            onClick = { onDayClick(dateStr) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CalendarDay(
    day: Int,
    hasEntries: Boolean,
    isToday: Boolean,
    isSelected: Boolean,
    jurisdictionColor: Color?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .aspectRatio(1f)
            .padding(2.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(
                when {
                    hasEntries && jurisdictionColor != null -> jurisdictionColor.copy(alpha = 0.25f)
                    isSelected -> SurfaceVariant
                    else -> Color.Transparent
                }
            )
            .border(
                width = if (isToday) 1.5.dp else if (isSelected) 1.dp else 0.dp,
                color = if (isToday) Primary else if (isSelected) TextSecondary else Color.Transparent,
                shape = RoundedCornerShape(8.dp)
            )
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = day.toString(),
                style = MaterialTheme.typography.bodySmall,
                fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
                color = if (isToday) Primary else TextPrimary
            )
            if (hasEntries && jurisdictionColor != null) {
                Spacer(modifier = Modifier.height(2.dp))
                Box(
                    modifier = Modifier
                        .size(4.dp)
                        .clip(CircleShape)
                        .background(jurisdictionColor)
                )
            }
        }
    }
}

@Composable
private fun CalendarLegend(jurisdictions: List<com.taxtrack.app.data.models.Jurisdiction>) {
    if (jurisdictions.isEmpty()) return

    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)) {
        Text(
            text = "Jurisdictions",
            style = MaterialTheme.typography.labelSmall,
            color = TextSecondary,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            jurisdictions.take(5).forEach { jurisdiction ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(colorFromHex(jurisdiction.color))
                    )
                    Text(
                        text = jurisdiction.name.take(10),
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary
                    )
                }
            }
        }
    }
}

@Composable
private fun DayDetailSheet(
    date: String,
    entries: List<com.taxtrack.app.data.models.LocationEntry>,
    jurisdictions: List<com.taxtrack.app.data.models.Jurisdiction>,
    onAddEntry: () -> Unit,
    onDeleteEntry: (String) -> Unit,
    onVerifyEntry: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
            .padding(bottom = 32.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = formatDateDisplay(date),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            IconButton(onClick = onAddEntry) {
                Icon(Icons.Filled.Add, contentDescription = "Add entry", tint = Primary)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (entries.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Filled.LocationOff, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(40.dp))
                    Text("No entries for this day", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    TextButton(onClick = onAddEntry) {
                        Text("Add Location Entry", color = Primary)
                    }
                }
            }
        } else {
            entries.forEach { entry ->
                val jurisdiction = jurisdictions.find { it.id == entry.jurisdictionId }
                EntryDetailCard(
                    entry = entry,
                    jurisdictionName = jurisdiction?.name ?: entry.jurisdictionId,
                    jurisdictionColor = jurisdiction?.let { colorFromHex(it.color) } ?: Primary,
                    onDelete = { onDeleteEntry(entry.id) },
                    onVerify = { onVerifyEntry(entry.id) }
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun EntryDetailCard(
    entry: com.taxtrack.app.data.models.LocationEntry,
    jurisdictionName: String,
    jurisdictionColor: Color,
    onDelete: () -> Unit,
    onVerify: () -> Unit
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }

    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(jurisdictionColor)
                    .offset(y = 6.dp)
            )

            Column(modifier = Modifier.weight(1f)) {
                Text(jurisdictionName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = TextPrimary)

                val location = buildString {
                    if (entry.city.isNotBlank()) append(entry.city)
                    if (entry.state.isNotBlank()) { if (isNotEmpty()) append(", "); append(entry.state) }
                }
                if (location.isNotBlank()) {
                    Text(location, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    SourceChip(entry.source)
                    ActivityChip(entry.activityType)
                    if (entry.isVerified) {
                        Surface(shape = RoundedCornerShape(4.dp), color = Secondary.copy(alpha = 0.15f)) {
                            Row(
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(3.dp)
                            ) {
                                Icon(Icons.Filled.Verified, contentDescription = null, tint = Secondary, modifier = Modifier.size(10.dp))
                                Text("Verified", style = MaterialTheme.typography.labelSmall, color = Secondary)
                            }
                        }
                    }
                }

                if (entry.notes.isNotBlank()) {
                    Text(
                        entry.notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                if (!entry.isVerified) {
                    IconButton(
                        onClick = onVerify,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Filled.Check, contentDescription = "Verify", tint = Secondary, modifier = Modifier.size(16.dp))
                    }
                }
                IconButton(
                    onClick = { showDeleteConfirm = true },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = RiskHigh, modifier = Modifier.size(16.dp))
                }
            }
        }
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete Entry") },
            text = { Text("Remove this location entry?") },
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

@Composable
private fun SourceChip(source: String) {
    val (label, color) = when (source) {
        "auto" -> "Auto" to Primary
        "manual" -> "Manual" to Accent
        "import" -> "Import" to Secondary
        else -> source.replaceFirstChar { it.uppercase() } to TextSecondary
    }
    Surface(shape = RoundedCornerShape(4.dp), color = color.copy(alpha = 0.15f)) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = color, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
    }
}

@Composable
private fun ActivityChip(activityType: String) {
    val label = activityType.replaceFirstChar { it.uppercase() }
    Surface(shape = RoundedCornerShape(4.dp), color = SurfaceVariant) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = TextSecondary, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
    }
}

private fun formatDateDisplay(dateStr: String): String {
    return try {
        val parts = dateStr.split("-")
        val cal = Calendar.getInstance().apply {
            set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt())
        }
        val dayOfWeek = java.text.DateFormatSymbols().weekdays[cal.get(Calendar.DAY_OF_WEEK)]
        val month = java.text.DateFormatSymbols().months[parts[1].toInt() - 1]
        "$dayOfWeek, $month ${parts[2]}, ${parts[0]}"
    } catch (e: Exception) {
        dateStr
    }
}
