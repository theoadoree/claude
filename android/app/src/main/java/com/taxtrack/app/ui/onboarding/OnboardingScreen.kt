package com.taxtrack.app.ui.onboarding

import androidx.compose.animation.*
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
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.taxtrack.app.ui.theme.*
import com.taxtrack.app.viewmodels.AppViewModel

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun OnboardingScreen(
    viewModel: AppViewModel,
    onComplete: () -> Unit
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var step by remember { mutableIntStateOf(0) }
    var userName by remember { mutableStateOf("") }
    var selectedPrimary by remember { mutableStateOf("") }
    var selectedTracked by remember { mutableStateOf(setOf<String>()) }

    val locationPermissions = rememberMultiplePermissionsState(
        permissions = listOf(
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        AnimatedContent(
            targetState = step,
            transitionSpec = {
                slideInHorizontally { it } + fadeIn() togetherWith
                        slideOutHorizontally { -it } + fadeOut()
            },
            label = "onboarding_step"
        ) { currentStep ->
            when (currentStep) {
                0 -> WelcomeStep(
                    onNext = { step = 1 }
                )
                1 -> NameStep(
                    name = userName,
                    onNameChange = { userName = it },
                    onNext = { step = 2 },
                    onBack = { step = 0 }
                )
                2 -> PrimaryResidencyStep(
                    jurisdictions = state.jurisdictions,
                    selectedId = selectedPrimary,
                    onSelect = { selectedPrimary = it },
                    onNext = { step = 3 },
                    onBack = { step = 1 }
                )
                3 -> TrackedJurisdictionsStep(
                    jurisdictions = state.jurisdictions,
                    selectedIds = selectedTracked,
                    primaryId = selectedPrimary,
                    onToggle = { id ->
                        selectedTracked = if (selectedTracked.contains(id)) {
                            selectedTracked - id
                        } else {
                            selectedTracked + id
                        }
                    },
                    onNext = { step = 4 },
                    onBack = { step = 2 }
                )
                4 -> TrackingPermissionsStep(
                    locationPermissions = locationPermissions,
                    onComplete = {
                        viewModel.completeOnboarding(
                            name = userName,
                            primaryJurisdictionId = selectedPrimary,
                            trackedIds = (selectedTracked + selectedPrimary).toList()
                        )
                        onComplete()
                    },
                    onBack = { step = 3 }
                )
            }
        }
    }
}

@Composable
private fun WelcomeStep(onNext: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
                .background(Primary.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Filled.LocationOn,
                contentDescription = null,
                tint = Primary,
                modifier = Modifier.size(56.dp)
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = "TaxTrack",
            style = MaterialTheme.typography.displaySmall,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Track your physical presence across tax jurisdictions. Stay compliant with residency rules and reduce your audit risk.",
            style = MaterialTheme.typography.bodyLarge,
            color = TextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp
        )

        Spacer(modifier = Modifier.height(48.dp))

        Column(
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            FeatureItem(Icons.Filled.TrackChanges, "Automatic Location Tracking", "Background tracking with FusedLocationProvider")
            FeatureItem(Icons.Filled.BarChart, "183-Day Rule Monitoring", "Track days per jurisdiction in real-time")
            FeatureItem(Icons.Filled.Description, "Evidence Vault", "Store boarding passes, hotel receipts, and photos")
            FeatureItem(Icons.Filled.Security, "Audit Risk Score", "Real-time risk assessment with recommendations")
        }

        Spacer(modifier = Modifier.height(48.dp))

        Button(
            onClick = onNext,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Get Started", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun FeatureItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(SurfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = Primary, modifier = Modifier.size(22.dp))
        }
        Column {
            Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = TextPrimary)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
        }
    }
}

@Composable
private fun NameStep(
    name: String,
    onNameChange: (String) -> Unit,
    onNext: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(60.dp))

        StepIndicator(currentStep = 1, totalSteps = 4)

        Spacer(modifier = Modifier.height(40.dp))

        Text(
            text = "What's your name?",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "This will personalize your experience",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(40.dp))

        OutlinedTextField(
            value = name,
            onValueChange = onNameChange,
            label = { Text("Your Name") },
            placeholder = { Text("e.g. Alex Johnson") },
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary,
                unfocusedBorderColor = Divider,
                focusedLabelColor = Primary,
                cursorColor = Primary
            ),
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )

        Spacer(modifier = Modifier.weight(1f))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onBack,
                modifier = Modifier.weight(1f).height(56.dp),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Back") }

            Button(
                onClick = onNext,
                modifier = Modifier.weight(2f).height(56.dp),
                enabled = name.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Continue", fontWeight = FontWeight.SemiBold) }
        }
    }
}

@Composable
private fun PrimaryResidencyStep(
    jurisdictions: List<com.taxtrack.app.data.models.Jurisdiction>,
    selectedId: String,
    onSelect: (String) -> Unit,
    onNext: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp)
    ) {
        Spacer(modifier = Modifier.height(60.dp))

        StepIndicator(currentStep = 2, totalSteps = 4, modifier = Modifier.padding(horizontal = 8.dp))

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = "Primary Residence",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
            modifier = Modifier.padding(horizontal = 8.dp)
        )
        Text(
            text = "Where do you claim domicile?",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            modifier = Modifier.padding(horizontal = 8.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
        ) {
            items(jurisdictions) { jurisdiction ->
                JurisdictionSelectCard(
                    name = jurisdiction.name,
                    type = jurisdiction.type,
                    color = colorFromHex(jurisdiction.color),
                    dayLimit = jurisdiction.dayLimit,
                    isSelected = jurisdiction.id == selectedId,
                    onClick = { onSelect(jurisdiction.id) }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onBack,
                modifier = Modifier.weight(1f).height(56.dp),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Back") }

            Button(
                onClick = onNext,
                modifier = Modifier.weight(2f).height(56.dp),
                enabled = selectedId.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Continue", fontWeight = FontWeight.SemiBold) }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun TrackedJurisdictionsStep(
    jurisdictions: List<com.taxtrack.app.data.models.Jurisdiction>,
    selectedIds: Set<String>,
    primaryId: String,
    onToggle: (String) -> Unit,
    onNext: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp)
    ) {
        Spacer(modifier = Modifier.height(60.dp))

        StepIndicator(currentStep = 3, totalSteps = 4, modifier = Modifier.padding(horizontal = 8.dp))

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = "Track Jurisdictions",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
            modifier = Modifier.padding(horizontal = 8.dp)
        )
        Text(
            text = "Select states/countries you frequently visit",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            modifier = Modifier.padding(horizontal = 8.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
        ) {
            items(jurisdictions.filter { it.id != primaryId }) { jurisdiction ->
                val isSelected = selectedIds.contains(jurisdiction.id)
                JurisdictionSelectCard(
                    name = jurisdiction.name,
                    type = jurisdiction.type,
                    color = colorFromHex(jurisdiction.color),
                    dayLimit = jurisdiction.dayLimit,
                    isSelected = isSelected,
                    showCheckbox = true,
                    onClick = { onToggle(jurisdiction.id) }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onBack,
                modifier = Modifier.weight(1f).height(56.dp),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Back") }

            Button(
                onClick = onNext,
                modifier = Modifier.weight(2f).height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Continue", fontWeight = FontWeight.SemiBold) }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
private fun TrackingPermissionsStep(
    locationPermissions: com.google.accompanist.permissions.MultiplePermissionsState,
    onComplete: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(60.dp))

        StepIndicator(currentStep = 4, totalSteps = 4)

        Spacer(modifier = Modifier.height(40.dp))

        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
                .background(Primary.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Filled.MyLocation,
                contentDescription = null,
                tint = Primary,
                modifier = Modifier.size(56.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Enable Location Tracking",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "TaxTrack needs location access to automatically record your presence in different jurisdictions.",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 22.sp
        )

        Spacer(modifier = Modifier.height(32.dp))

        PermissionItem(
            title = "Precise Location",
            subtitle = "Required for accurate jurisdiction detection",
            isGranted = locationPermissions.permissions.any { it.permission == android.Manifest.permission.ACCESS_FINE_LOCATION && it.status.isGranted }
        )

        Spacer(modifier = Modifier.height(12.dp))

        PermissionItem(
            title = "Background Location",
            subtitle = "Recommended for automatic tracking while app is closed",
            isGranted = false,
            isOptional = true
        )

        Spacer(modifier = Modifier.weight(1f))

        if (!locationPermissions.allPermissionsGranted) {
            Button(
                onClick = { locationPermissions.launchMultiplePermissionRequest() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Filled.LocationOn, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Grant Location Access", fontWeight = FontWeight.SemiBold)
            }

            Spacer(modifier = Modifier.height(12.dp))
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onBack,
                modifier = Modifier.weight(1f).height(56.dp),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Back") }

            Button(
                onClick = onComplete,
                modifier = Modifier.weight(2f).height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (locationPermissions.allPermissionsGranted) Primary else Secondary
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    if (locationPermissions.allPermissionsGranted) "Start Tracking" else "Skip for Now",
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
private fun StepIndicator(
    currentStep: Int,
    totalSteps: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(totalSteps) { index ->
            Box(
                modifier = Modifier
                    .height(4.dp)
                    .width(if (index + 1 == currentStep) 24.dp else 16.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(if (index + 1 <= currentStep) Primary else SurfaceVariant)
            )
        }
    }
}

@Composable
private fun JurisdictionSelectCard(
    name: String,
    type: String,
    color: Color,
    dayLimit: Int,
    isSelected: Boolean,
    showCheckbox: Boolean = false,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) color else Divider,
                shape = RoundedCornerShape(12.dp)
            ),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) color.copy(alpha = 0.1f) else Surface
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(color.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.LocationOn,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(20.dp)
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                Text(
                    "${type.replaceFirstChar { it.uppercase() }} • ${dayLimit}-day limit",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }

            if (showCheckbox) {
                Checkbox(
                    checked = isSelected,
                    onCheckedChange = { onClick() },
                    colors = CheckboxDefaults.colors(checkedColor = color)
                )
            } else if (isSelected) {
                Icon(Icons.Filled.CheckCircle, contentDescription = "Selected", tint = color, modifier = Modifier.size(24.dp))
            }
        }
    }
}

@Composable
private fun PermissionItem(
    title: String,
    subtitle: String,
    isGranted: Boolean,
    isOptional: Boolean = false
) {
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
            Icon(
                imageVector = if (isGranted) Icons.Filled.CheckCircle else Icons.Filled.Circle,
                contentDescription = null,
                tint = if (isGranted) RiskLow else if (isOptional) TextSecondary else Accent,
                modifier = Modifier.size(24.dp)
            )
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    if (isOptional) {
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = SurfaceVariant
                        ) {
                            Text(
                                "Optional",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextSecondary,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
        }
    }
}
