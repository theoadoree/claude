package com.taxtrack.app.ui.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.taxtrack.app.ui.theme.*
import com.taxtrack.app.viewmodels.AppViewModel
import java.util.Calendar
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.PI

@Composable
fun DashboardScreen(
    viewModel: AppViewModel,
    onNavigateToCalendar: () -> Unit,
    onNavigateToDocuments: () -> Unit,
    onAddEntry: () -> Unit
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val currentYear = Calendar.getInstance().get(Calendar.YEAR)
    val yearRange = (currentYear - 3..currentYear).toList().reversed()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // Header
        item {
            DashboardHeader(
                userName = state.profile.name,
                selectedYear = state.selectedYear,
                yearRange = yearRange,
                onYearChange = { viewModel.setSelectedYear(it) },
                isTracking = state.isTrackingActive,
                onToggleTracking = {
                    if (state.isTrackingActive) viewModel.stopLocationTracking()
                    else viewModel.startLocationTracking()
                }
            )
        }

        // Days overview
        item {
            DaysOverviewSection(
                entries = state.entries.filter { it.date.startsWith(state.selectedYear.toString()) },
                selectedYear = state.selectedYear
            )
        }

        // Audit Risk Gauge
        item {
            AuditRiskSection(
                score = state.auditRisk.score,
                level = state.auditRisk.level,
                factors = state.auditRisk.factors
            )
        }

        // Jurisdiction cards
        if (state.jurisdictionStats.isNotEmpty()) {
            item {
                Text(
                    text = "Jurisdiction Overview",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                )
            }

            items(state.jurisdictionStats) { stat ->
                JurisdictionCard(stat = stat)
            }
        }

        // Quick actions
        item {
            QuickActionsSection(
                onAddEntry = onAddEntry,
                onViewCalendar = onNavigateToCalendar,
                onViewDocuments = onNavigateToDocuments
            )
        }
    }
}

@Composable
private fun DashboardHeader(
    userName: String,
    selectedYear: Int,
    yearRange: List<Int>,
    onYearChange: (Int) -> Unit,
    isTracking: Boolean,
    onToggleTracking: () -> Unit
) {
    var showYearMenu by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = if (userName.isNotBlank()) "Hello, ${userName.split(" ").first()}" else "TaxTrack",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = "Tax Year ${selectedYear}",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Year selector
            Box {
                OutlinedButton(
                    onClick = { showYearMenu = true },
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                    border = BorderStroke(1.dp, Divider)
                ) {
                    Text(selectedYear.toString(), color = TextPrimary, style = MaterialTheme.typography.labelMedium)
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(16.dp))
                }
                DropdownMenu(
                    expanded = showYearMenu,
                    onDismissRequest = { showYearMenu = false },
                    modifier = Modifier.background(Surface)
                ) {
                    yearRange.forEach { year ->
                        DropdownMenuItem(
                            text = { Text(year.toString(), color = if (year == selectedYear) Primary else TextPrimary) },
                            onClick = { onYearChange(year); showYearMenu = false }
                        )
                    }
                }
            }

            // Tracking toggle
            IconButton(
                onClick = onToggleTracking,
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (isTracking) Primary.copy(alpha = 0.2f) else SurfaceVariant)
            ) {
                Icon(
                    imageVector = if (isTracking) Icons.Filled.LocationOn else Icons.Filled.LocationOff,
                    contentDescription = "Toggle tracking",
                    tint = if (isTracking) Primary else TextSecondary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
private fun DaysOverviewSection(
    entries: List<com.taxtrack.app.data.models.LocationEntry>,
    selectedYear: Int
) {
    val cal = Calendar.getInstance()
    val isCurrentYear = cal.get(Calendar.YEAR) == selectedYear
    val totalDays = if (isCurrentYear) cal.get(Calendar.DAY_OF_YEAR) else 365
    val loggedDays = entries.map { it.date }.toSet().size
    val verifiedDays = entries.filter { it.isVerified }.map { it.date }.toSet().size
    val missingDays = totalDays - loggedDays

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "Year at a Glance",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                DayStatItem("$loggedDays", "Logged Days", Primary)
                DayStatItem("$verifiedDays", "Verified", Secondary)
                DayStatItem("$missingDays", "Missing", if (missingDays > totalDays / 2) RiskHigh else TextSecondary)
                DayStatItem("$totalDays", "Total", TextSecondary)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Progress bar
            val progress = if (totalDays > 0) loggedDays.toFloat() / totalDays else 0f
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Coverage", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                    Text("${(progress * 100).toInt()}%", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                }
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                    color = when {
                        progress >= 0.8f -> Secondary
                        progress >= 0.5f -> Accent
                        else -> RiskHigh
                    },
                    trackColor = SurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun DayStatItem(value: String, label: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = color)
        Text(label, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
    }
}

@Composable
private fun AuditRiskSection(
    score: Int,
    level: String,
    factors: List<com.taxtrack.app.data.models.RiskFactor>
) {
    val riskColor = when (level) {
        "low" -> RiskLow
        "moderate" -> RiskModerate
        "high" -> RiskHigh
        "critical" -> RiskCritical
        else -> RiskLow
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "Audit Risk Score",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Gauge
                AuditRiskGauge(score = score, color = riskColor, modifier = Modifier.size(140.dp))

                // Details
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = level.replaceFirstChar { it.uppercase() } + " Risk",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = riskColor
                    )
                    Text(
                        text = "Score: $score / 100",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    factors.take(3).forEach { factor ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = if (factor.isPositive) Icons.Filled.TrendingUp else Icons.Filled.TrendingDown,
                                contentDescription = null,
                                tint = if (factor.isPositive) Secondary else RiskHigh,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = factor.impact,
                                style = MaterialTheme.typography.labelSmall,
                                color = if (factor.isPositive) Secondary else RiskHigh,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AuditRiskGauge(score: Int, color: Color, modifier: Modifier = Modifier) {
    val animatedScore by animateFloatAsState(
        targetValue = score.toFloat(),
        animationSpec = tween(durationMillis = 1000, easing = EaseOut),
        label = "gauge_animation"
    )

    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val strokeWidth = 16.dp.toPx()
            val radius = (size.minDimension - strokeWidth) / 2f
            val center = Offset(size.width / 2f, size.height / 2f)

            val startAngle = 135f
            val sweepAngle = 270f

            // Background arc
            drawArc(
                color = SurfaceVariant,
                startAngle = startAngle,
                sweepAngle = sweepAngle,
                useCenter = false,
                topLeft = Offset(center.x - radius, center.y - radius),
                size = Size(radius * 2, radius * 2),
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // Score arc
            val scoreSweep = (animatedScore / 100f) * sweepAngle
            drawArc(
                brush = Brush.sweepGradient(
                    colors = listOf(color.copy(alpha = 0.7f), color),
                    center = center
                ),
                startAngle = startAngle,
                sweepAngle = scoreSweep,
                useCenter = false,
                topLeft = Offset(center.x - radius, center.y - radius),
                size = Size(radius * 2, radius * 2),
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // Needle tip dot
            val needleAngleDeg = startAngle + scoreSweep
            val needleAngleRad = needleAngleDeg * (PI / 180).toFloat()
            val tipX = center.x + radius * cos(needleAngleRad).toFloat()
            val tipY = center.y + radius * sin(needleAngleRad).toFloat()
            drawCircle(color = color, radius = strokeWidth / 2, center = Offset(tipX, tipY))
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = score.toString(),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = "/ 100",
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun JurisdictionCard(stat: com.taxtrack.app.data.models.JurisdictionStats) {
    val color = colorFromHex(stat.color)
    val riskColor = when (stat.riskLevel) {
        "low" -> RiskLow
        "moderate" -> RiskModerate
        "high" -> RiskHigh
        "critical" -> RiskCritical
        else -> RiskLow
    }

    val animatedProgress by animateFloatAsState(
        targetValue = stat.percentUsed.coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 800, easing = EaseOut),
        label = "progress"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(color)
                    )
                    Text(stat.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = riskColor.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = stat.riskLevel.replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelSmall,
                        color = riskColor,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${stat.daysSpent} days",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextPrimary,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "${(stat.percentUsed * 100).toInt()}% of ${stat.dayLimit} day limit",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            LinearProgressIndicator(
                progress = { animatedProgress },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                color = riskColor,
                trackColor = SurfaceVariant
            )
        }
    }
}

@Composable
private fun QuickActionsSection(
    onAddEntry: () -> Unit,
    onViewCalendar: () -> Unit,
    onViewDocuments: () -> Unit
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
        Text(
            text = "Quick Actions",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            color = TextPrimary
        )
        Spacer(modifier = Modifier.height(12.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            QuickActionButton(
                icon = Icons.Filled.AddLocation,
                label = "Add Day",
                color = Primary,
                modifier = Modifier.weight(1f),
                onClick = onAddEntry
            )
            QuickActionButton(
                icon = Icons.Filled.CalendarMonth,
                label = "Calendar",
                color = Secondary,
                modifier = Modifier.weight(1f),
                onClick = onViewCalendar
            )
            QuickActionButton(
                icon = Icons.Filled.FilePresent,
                label = "Documents",
                color = Accent,
                modifier = Modifier.weight(1f),
                onClick = onViewDocuments
            )
        }
    }
}

@Composable
private fun QuickActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, color.copy(alpha = 0.3f))
    ) {
        Column(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(28.dp))
            Text(label, style = MaterialTheme.typography.labelSmall, color = color, fontWeight = FontWeight.SemiBold)
        }
    }
}
