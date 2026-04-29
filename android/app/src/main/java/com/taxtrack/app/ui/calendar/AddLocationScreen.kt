package com.taxtrack.app.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.taxtrack.app.ui.theme.*
import com.taxtrack.app.viewmodels.AppViewModel
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddLocationScreen(
    viewModel: AppViewModel,
    initialDate: String?,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    val todayStr = Calendar.getInstance().let {
        String.format("%04d-%02d-%02d", it.get(Calendar.YEAR), it.get(Calendar.MONTH) + 1, it.get(Calendar.DAY_OF_MONTH))
    }

    var selectedDate by remember { mutableStateOf(initialDate ?: todayStr) }
    var selectedJurisdictionId by remember { mutableStateOf(state.profile.primaryJurisdictionId) }
    var city by remember { mutableStateOf("") }
    var stateField by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("United States") }
    var activityType by remember { mutableStateOf("unknown") }
    var notes by remember { mutableStateOf("") }

    var showDatePicker by remember { mutableStateOf(false) }
    var showJurisdictionPicker by remember { mutableStateOf(false) }

    val selectedJurisdiction = state.jurisdictions.find { it.id == selectedJurisdictionId }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add Location Entry", fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Background,
                    titleContentColor = TextPrimary
                )
            )
        },
        containerColor = Background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Date field
            SectionLabel("Date")
            OutlinedCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { showDatePicker = true },
                shape = RoundedCornerShape(12.dp),
                border = CardDefaults.outlinedCardBorder()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(Icons.Filled.CalendarToday, contentDescription = null, tint = Primary, modifier = Modifier.size(20.dp))
                    Text(
                        text = formatDateForDisplay(selectedDate),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextPrimary
                    )
                }
            }

            // Jurisdiction
            SectionLabel("Jurisdiction")
            OutlinedCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { showJurisdictionPicker = true },
                shape = RoundedCornerShape(12.dp),
                border = CardDefaults.outlinedCardBorder()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(16.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(selectedJurisdiction?.let { colorFromHex(it.color) } ?: Primary)
                        )
                        Text(
                            text = selectedJurisdiction?.name ?: "Select jurisdiction",
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (selectedJurisdiction != null) TextPrimary else TextSecondary
                        )
                    }
                    Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(20.dp))
                }
            }

            // Location fields
            SectionLabel("Location Details")

            OutlinedTextField(
                value = city,
                onValueChange = { city = it },
                label = { Text("City") },
                placeholder = { Text("e.g. New York City") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = outlinedTextFieldColors(),
                leadingIcon = { Icon(Icons.Filled.LocationCity, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(20.dp)) },
                singleLine = true
            )

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = stateField,
                    onValueChange = { stateField = it },
                    label = { Text("State/Province") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = outlinedTextFieldColors(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = country,
                    onValueChange = { country = it },
                    label = { Text("Country") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = outlinedTextFieldColors(),
                    singleLine = true
                )
            }

            // Activity type
            SectionLabel("Activity Type")
            ActivityTypeSelector(
                selected = activityType,
                onSelect = { activityType = it }
            )

            // Notes
            SectionLabel("Notes (Optional)")
            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes") },
                placeholder = { Text("Add any context or details...") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = outlinedTextFieldColors(),
                minLines = 3,
                maxLines = 5
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Save button
            Button(
                onClick = {
                    if (selectedJurisdictionId.isNotBlank()) {
                        viewModel.addLocationEntry(
                            date = selectedDate,
                            jurisdictionId = selectedJurisdictionId,
                            city = city,
                            state = stateField,
                            country = country,
                            activityType = activityType,
                            notes = notes
                        )
                        onBack()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = selectedJurisdictionId.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Filled.Save, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Save Entry", fontWeight = FontWeight.SemiBold)
            }
        }
    }

    // Date picker dialog
    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            selectedDate = selectedDate,
            onDateSelected = { selectedDate = it; showDatePicker = false }
        )
    }

    // Jurisdiction picker
    if (showJurisdictionPicker) {
        JurisdictionPickerDialog(
            jurisdictions = state.jurisdictions,
            selectedId = selectedJurisdictionId,
            onSelect = { selectedJurisdictionId = it; showJurisdictionPicker = false },
            onDismiss = { showJurisdictionPicker = false }
        )
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelMedium,
        color = TextSecondary,
        fontWeight = FontWeight.SemiBold
    )
}

@Composable
private fun ActivityTypeSelector(
    selected: String,
    onSelect: (String) -> Unit
) {
    val types = listOf(
        "work" to Icons.Filled.Work,
        "personal" to Icons.Filled.Person,
        "transit" to Icons.Filled.Flight,
        "unknown" to Icons.Filled.HelpOutline
    )

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        types.forEach { (type, icon) ->
            val isSelected = type == selected
            OutlinedCard(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onSelect(type) },
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.outlinedCardColors(
                    containerColor = if (isSelected) Primary.copy(alpha = 0.15f) else Background
                ),
                border = if (isSelected) {
                    androidx.compose.foundation.BorderStroke(1.5.dp, Primary)
                } else CardDefaults.outlinedCardBorder()
            ) {
                Column(
                    modifier = Modifier.padding(10.dp).fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        icon, contentDescription = type,
                        tint = if (isSelected) Primary else TextSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        type.replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isSelected) Primary else TextSecondary
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DatePickerDialog(
    onDismissRequest: () -> Unit,
    selectedDate: String,
    onDateSelected: (String) -> Unit
) {
    val parts = selectedDate.split("-")
    val initialMillis = try {
        Calendar.getInstance().apply {
            set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt())
        }.timeInMillis
    } catch (e: Exception) {
        System.currentTimeMillis()
    }

    val datePickerState = rememberDatePickerState(initialSelectedDateMillis = initialMillis)

    androidx.compose.material3.DatePickerDialog(
        onDismissRequest = onDismissRequest,
        confirmButton = {
            TextButton(onClick = {
                datePickerState.selectedDateMillis?.let { millis ->
                    val cal = Calendar.getInstance().apply { timeInMillis = millis }
                    val date = String.format(
                        "%04d-%02d-%02d",
                        cal.get(Calendar.YEAR),
                        cal.get(Calendar.MONTH) + 1,
                        cal.get(Calendar.DAY_OF_MONTH)
                    )
                    onDateSelected(date)
                } ?: onDismissRequest()
            }) { Text("OK", color = Primary) }
        },
        dismissButton = {
            TextButton(onClick = onDismissRequest) { Text("Cancel") }
        },
        colors = DatePickerDefaults.colors(containerColor = Surface)
    ) {
        DatePicker(
            state = datePickerState,
            colors = DatePickerDefaults.colors(
                containerColor = Surface,
                selectedDayContainerColor = Primary,
                todayDateBorderColor = Primary
            )
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun JurisdictionPickerDialog(
    jurisdictions: List<com.taxtrack.app.data.models.Jurisdiction>,
    selectedId: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Jurisdiction", color = TextPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                jurisdictions.forEach { jurisdiction ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { onSelect(jurisdiction.id) }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(14.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(colorFromHex(jurisdiction.color))
                        )
                        Text(
                            jurisdiction.name,
                            modifier = Modifier.weight(1f),
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextPrimary
                        )
                        if (jurisdiction.id == selectedId) {
                            Icon(Icons.Filled.Check, contentDescription = "Selected", tint = Primary, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        },
        containerColor = Surface
    )
}

@Composable
private fun outlinedTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Primary,
    unfocusedBorderColor = Divider,
    focusedLabelColor = Primary,
    cursorColor = Primary,
    focusedTextColor = TextPrimary,
    unfocusedTextColor = TextPrimary
)

private fun formatDateForDisplay(dateStr: String): String {
    return try {
        val parts = dateStr.split("-")
        val cal = Calendar.getInstance().apply {
            set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt())
        }
        val month = java.text.DateFormatSymbols().months[parts[1].toInt() - 1]
        "$month ${parts[2]}, ${parts[0]}"
    } catch (e: Exception) {
        dateStr
    }
}
