package com.taxtrack.app.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.taxtrack.app.ui.calendar.AddLocationScreen
import com.taxtrack.app.ui.calendar.CalendarScreen
import com.taxtrack.app.ui.dashboard.DashboardScreen
import com.taxtrack.app.ui.documents.DocumentsScreen
import com.taxtrack.app.ui.map.MapScreen
import com.taxtrack.app.ui.onboarding.OnboardingScreen
import com.taxtrack.app.ui.planning.PlanningScreen
import com.taxtrack.app.ui.settings.SettingsScreen
import com.taxtrack.app.viewmodels.AppViewModel

sealed class Screen(val route: String) {
    object Onboarding : Screen("onboarding")
    object Dashboard : Screen("dashboard")
    object Calendar : Screen("calendar")
    object Map : Screen("map")
    object Planning : Screen("planning")
    object Documents : Screen("documents")
    object Settings : Screen("settings")
    object AddLocation : Screen("add_location?date={date}") {
        fun createRoute(date: String? = null) = if (date != null) "add_location?date=$date" else "add_location"
    }
}

data class BottomNavItem(
    val screen: Screen,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)

@Composable
fun TaxTrackApp(
    viewModel: AppViewModel = viewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val navController = rememberNavController()

    val bottomNavItems = listOf(
        BottomNavItem(Screen.Dashboard, "Dashboard", Icons.Filled.Home),
        BottomNavItem(Screen.Calendar, "Calendar", Icons.Filled.CalendarMonth),
        BottomNavItem(Screen.Map, "Map", Icons.Filled.Map),
        BottomNavItem(Screen.Planning, "Planning", Icons.Filled.BarChart),
        BottomNavItem(Screen.Settings, "Settings", Icons.Filled.Settings)
    )

    val startDestination = if (state.profile.hasCompletedOnboarding) {
        Screen.Dashboard.route
    } else {
        Screen.Onboarding.route
    }

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    val showBottomBar = currentDestination?.route != Screen.Onboarding.route &&
            !currentDestination?.route.orEmpty().startsWith("add_location")

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = com.taxtrack.app.ui.theme.Surface
                ) {
                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            icon = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label, style = MaterialTheme.typography.labelSmall) },
                            selected = currentDestination?.hierarchy?.any { it.route == item.screen.route } == true,
                            onClick = {
                                navController.navigate(item.screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = com.taxtrack.app.ui.theme.Primary,
                                selectedTextColor = com.taxtrack.app.ui.theme.Primary,
                                unselectedIconColor = com.taxtrack.app.ui.theme.TextSecondary,
                                unselectedTextColor = com.taxtrack.app.ui.theme.TextSecondary,
                                indicatorColor = com.taxtrack.app.ui.theme.SurfaceVariant
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Onboarding.route) {
                OnboardingScreen(
                    viewModel = viewModel,
                    onComplete = {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Onboarding.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    viewModel = viewModel,
                    onNavigateToCalendar = { navController.navigate(Screen.Calendar.route) },
                    onNavigateToDocuments = { navController.navigate(Screen.Documents.route) },
                    onAddEntry = { navController.navigate(Screen.AddLocation.createRoute()) }
                )
            }

            composable(Screen.Calendar.route) {
                CalendarScreen(
                    viewModel = viewModel,
                    onAddEntry = { date ->
                        navController.navigate(Screen.AddLocation.createRoute(date))
                    }
                )
            }

            composable(Screen.Map.route) {
                MapScreen(viewModel = viewModel)
            }

            composable(Screen.Planning.route) {
                PlanningScreen(viewModel = viewModel)
            }

            composable(Screen.Documents.route) {
                DocumentsScreen(viewModel = viewModel)
            }

            composable(Screen.Settings.route) {
                SettingsScreen(viewModel = viewModel)
            }

            composable("add_location?date={date}") { backStackEntry ->
                val date = backStackEntry.arguments?.getString("date")
                AddLocationScreen(
                    viewModel = viewModel,
                    initialDate = date,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}
