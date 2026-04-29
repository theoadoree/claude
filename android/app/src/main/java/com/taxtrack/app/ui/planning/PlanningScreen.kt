package com.taxtrack.app.ui.planning

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
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.taxtrack.app.data.models.TaxPlanningInsight
import com.taxtrack.app.ui.theme.*
import com.taxtrack.app.viewmodels.AppViewModel

@Composable
fun PlanningScreen(viewModel: AppViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Insights", "Opportunities", "Risk Analysis")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        // Header
        Text(
            text = "Tax Planning",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
        )

        // Tabs
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Surface,
            contentColor = Primary,
            indicator = { tabPositions ->
                Box(
                    Modifier
                        .tabIndicatorOffset(tabPositions[selectedTab])
                        .height(2.dp)
                        .background(Primary)
                )
            }
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = {
                        Text(
                            title,
                            style = MaterialTheme.typography.labelMedium,
                            color = if (selectedTab == index) Primary else TextSecondary
                        )
                    }
                )
            }
        }

        when (selectedTab) {
            0 -> InsightsTab(insights = state.insights)
            1 -> OpportunitiesTab()
            2 -> RiskAnalysisTab(
                risk = state.auditRisk,
                stats = state.jurisdictionStats
            )
        }
    }
}

@Composable
private fun InsightsTab(insights: List<TaxPlanningInsight>) {
    if (insights.isEmpty()) {
        EmptyInsightsPlaceholder()
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(insights) { insight ->
            InsightCard(insight = insight)
        }
    }
}

@Composable
private fun InsightCard(insight: TaxPlanningInsight) {
    val (bgColor, iconColor, icon) = when (insight.type) {
        "warning" -> Triple(RiskHigh.copy(alpha = 0.1f), RiskHigh, Icons.Filled.Warning)
        "opportunity" -> Triple(Secondary.copy(alpha = 0.1f), Secondary, Icons.Filled.TrendingUp)
        "action" -> Triple(Primary.copy(alpha = 0.1f), Primary, Icons.Filled.Assignment)
        "planning" -> Triple(Accent.copy(alpha = 0.1f), Accent, Icons.Filled.CalendarMonth)
        else -> Triple(SurfaceVariant, TextSecondary, Icons.Filled.Info)
    }

    val priorityColor = when (insight.priority) {
        "high" -> RiskHigh
        "medium" -> Accent
        "low" -> TextSecondary
        else -> TextSecondary
    }

    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { expanded = !expanded },
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(bgColor),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(22.dp))
                }

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = insight.title,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary,
                            modifier = Modifier.weight(1f)
                        )
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = priorityColor.copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = insight.priority.replaceFirstChar { it.uppercase() },
                                style = MaterialTheme.typography.labelSmall,
                                color = priorityColor,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(
                        text = insight.message,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        maxLines = if (expanded) Int.MAX_VALUE else 2
                    )
                }

                Icon(
                    if (expanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                    contentDescription = null,
                    tint = TextSecondary,
                    modifier = Modifier.size(20.dp)
                )
            }

            if (expanded && insight.actionItems.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Divider)
                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    "Action Items",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))

                insight.actionItems.forEachIndexed { index, item ->
                    Row(
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(vertical = 3.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .clip(CircleShape)
                                .background(iconColor.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "${index + 1}",
                                style = MaterialTheme.typography.labelSmall,
                                color = iconColor,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text = item,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextPrimary,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun OpportunitiesTab() {
    val opportunities = listOf(
        OpportunityItem(
            flag = "🌴",
            name = "Florida",
            subtitle = "No state income tax",
            description = "Establish domicile in Florida by spending 183+ days and creating strong ties: primary home, driver's license, voter registration.",
            savings = "0% state income tax",
            color = Color(0xFFFF9F0A),
            steps = listOf(
                "Spend 183+ days in Florida",
                "Purchase or rent a home as primary residence",
                "Obtain FL driver's license and voter registration",
                "Establish Florida bank accounts",
                "Transfer vehicle registration to Florida"
            )
        ),
        OpportunityItem(
            flag = "⭐",
            name = "Texas",
            subtitle = "No state income tax",
            description = "Texas has no state income tax and a lower cost of living than many high-tax states.",
            savings = "0% state income tax",
            color = Color(0xFFFF453A),
            steps = listOf(
                "Establish primary residence in Texas",
                "Spend majority of year in state",
                "Get TX driver's license and register vehicle",
                "Update professional licenses if applicable"
            )
        ),
        OpportunityItem(
            flag = "🎰",
            name = "Nevada",
            subtitle = "No state income tax",
            description = "Nevada offers no state income tax and is a popular domicile state for high earners.",
            savings = "0% state income tax",
            color = Color(0xFFBF5AF2),
            steps = listOf(
                "Establish Nevada domicile",
                "Spend 183+ days in state",
                "Obtain NV driver's license and ID",
                "Use Nevada address for financial accounts"
            )
        ),
        OpportunityItem(
            flag = "🌲",
            name = "Washington State",
            subtitle = "No state income tax",
            description = "Washington State has no personal income tax, making it attractive for tech workers and investors.",
            savings = "0% state income tax",
            color = Color(0xFF0A84FF),
            steps = listOf(
                "Establish residence in Washington",
                "Spend 183+ days in state",
                "Obtain WA state ID and register vehicles",
                "Note: capital gains tax applies above threshold"
            )
        ),
        OpportunityItem(
            flag = "🌊",
            name = "Puerto Rico (Act 60)",
            subtitle = "Individual Resident Investor",
            description = "Puerto Rico Act 60 offers 0% tax on dividends and capital gains, 4% on qualified business income for bona fide residents.",
            savings = "0-4% on qualifying income",
            color = Color(0xFF30D158),
            steps = listOf(
                "Spend 183+ days in Puerto Rico",
                "Establish primary residence on island",
                "Purchase residential property",
                "Make charitable donations to PR nonprofits",
                "File for Act 60 Individual Resident Investor Decree",
                "Maintain residence for minimum 2 years"
            )
        ),
        OpportunityItem(
            flag = "🇬🇧",
            name = "UK Non-Dom Status",
            subtitle = "Non-Domiciled Resident",
            description = "UK non-domiciled residents can use the remittance basis, only paying UK tax on income brought into the UK.",
            savings = "Tax only on UK-source income",
            color = Color(0xFFFF6B6B),
            steps = listOf(
                "Obtain UK residence permit",
                "Establish foreign domicile of origin",
                "Claim non-dom status on tax return",
                "Keep foreign income offshore",
                "Consult specialist UK tax advisor"
            )
        )
    )

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                "Tax-Friendly Jurisdictions",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Text(
                "Recommended locations for tax optimization",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(4.dp))
        }

        items(opportunities) { opportunity ->
            OpportunityCard(opportunity = opportunity)
        }
    }
}

data class OpportunityItem(
    val flag: String,
    val name: String,
    val subtitle: String,
    val description: String,
    val savings: String,
    val color: Color,
    val steps: List<String>
)

@Composable
private fun OpportunityCard(opportunity: OpportunityItem) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { expanded = !expanded },
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(opportunity.color.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(opportunity.flag, style = MaterialTheme.typography.titleLarge)
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        opportunity.name,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        opportunity.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Secondary.copy(alpha = 0.15f)
                ) {
                    Text(
                        opportunity.savings,
                        style = MaterialTheme.typography.labelSmall,
                        color = Secondary,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                opportunity.description,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
                maxLines = if (expanded) Int.MAX_VALUE else 2
            )

            if (expanded) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Divider)
                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    "Steps to Qualify",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))

                opportunity.steps.forEachIndexed { index, step ->
                    Row(
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(vertical = 3.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .clip(CircleShape)
                                .background(opportunity.color.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "${index + 1}",
                                style = MaterialTheme.typography.labelSmall,
                                color = opportunity.color,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(step, style = MaterialTheme.typography.bodySmall, color = TextPrimary, modifier = Modifier.weight(1f))
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(onClick = { expanded = !expanded }) {
                    Text(
                        if (expanded) "Show Less" else "Learn More",
                        color = opportunity.color,
                        style = MaterialTheme.typography.labelMedium
                    )
                    Icon(
                        if (expanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                        contentDescription = null,
                        tint = opportunity.color,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun RiskAnalysisTab(
    risk: com.taxtrack.app.data.models.AuditRisk,
    stats: List<com.taxtrack.app.data.models.JurisdictionStats>
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Overall score card
        item {
            val riskColor = when (risk.level) {
                "low" -> RiskLow
                "moderate" -> RiskModerate
                "high" -> RiskHigh
                "critical" -> RiskCritical
                else -> RiskLow
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = riskColor.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, riskColor.copy(alpha = 0.3f))
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(riskColor.copy(alpha = 0.2f)),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            risk.score.toString(),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = riskColor
                        )
                        Text("/100", style = MaterialTheme.typography.labelSmall, color = riskColor)
                    }

                    Column {
                        Text(
                            "${risk.level.replaceFirstChar { it.uppercase() }} Risk",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = riskColor
                        )
                        Text(
                            "Audit Risk Assessment",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }
            }
        }

        // Risk factors
        if (risk.factors.isNotEmpty()) {
            item {
                Text(
                    "Risk Factors",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
            }

            items(risk.factors) { factor ->
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
                            if (factor.isPositive) Icons.Filled.AddCircle else Icons.Filled.RemoveCircle,
                            contentDescription = null,
                            tint = if (factor.isPositive) Secondary else RiskHigh,
                            modifier = Modifier.size(24.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                factor.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextPrimary
                            )
                        }
                        Text(
                            factor.impact,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (factor.isPositive) Secondary else RiskHigh
                        )
                    }
                }
            }
        }

        // Recommendations
        if (risk.recommendations.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Recommendations",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
            }

            items(risk.recommendations) { recommendation ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Primary.copy(alpha = 0.08f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(
                            Icons.Filled.Lightbulb,
                            contentDescription = null,
                            tint = Accent,
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            recommendation,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextPrimary,
                            lineHeight = androidx.compose.ui.unit.TextUnit(20f, androidx.compose.ui.unit.TextUnitType.Sp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyInsightsPlaceholder() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(Icons.Filled.BarChart, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(56.dp))
            Text("No Insights Yet", style = MaterialTheme.typography.titleMedium, color = TextPrimary, fontWeight = FontWeight.Bold)
            Text(
                "Add location entries to generate personalized tax planning insights.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
    }
}
