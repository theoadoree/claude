package com.taxtrack.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Primary,
    onPrimary = OnPrimary,
    primaryContainer = PrimaryVariant,
    onPrimaryContainer = Color(0xFFD6E4FF),
    secondary = Secondary,
    onSecondary = OnSecondary,
    secondaryContainer = Color(0xFF004D1A),
    onSecondaryContainer = Color(0xFFB3FFCC),
    tertiary = Accent,
    onTertiary = Color(0xFF000000),
    tertiaryContainer = Color(0xFF4D2E00),
    onTertiaryContainer = Color(0xFFFFDDB3),
    background = Background,
    onBackground = TextPrimary,
    surface = Surface,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceVariant,
    onSurfaceVariant = TextSecondary,
    error = RiskHigh,
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFF4D1515),
    onErrorContainer = Color(0xFFFFB3B3),
    outline = Divider,
    outlineVariant = Color(0xFF2C2C2E)
)

@Composable
fun TaxTrackTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = androidx.compose.material3.Typography(),
        content = content
    )
}
