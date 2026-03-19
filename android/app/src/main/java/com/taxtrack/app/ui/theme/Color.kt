package com.taxtrack.app.ui.theme

import androidx.compose.ui.graphics.Color

// Background & Surface
val Background = Color(0xFF0C0C0E)
val Surface = Color(0xFF1C1C1E)
val SurfaceVariant = Color(0xFF2C2C2E)
val OnSurface = Color(0xFFFFFFFF)
val OnSurfaceVariant = Color(0xFF8E8E93)

// Primary
val Primary = Color(0xFF0A84FF)
val PrimaryVariant = Color(0xFF0066CC)
val OnPrimary = Color(0xFFFFFFFF)

// Secondary
val Secondary = Color(0xFF30D158)
val OnSecondary = Color(0xFF000000)

// Accent
val Accent = Color(0xFFFF9F0A)

// Risk Colors
val RiskLow = Color(0xFF30D158)
val RiskModerate = Color(0xFFFF9F0A)
val RiskHigh = Color(0xFFFF453A)
val RiskCritical = Color(0xFF8E2929)

// Jurisdiction Palette
val JurisdictionColors = listOf(
    Color(0xFF0A84FF),
    Color(0xFF30D158),
    Color(0xFFFF9F0A),
    Color(0xFFFF453A),
    Color(0xFFBF5AF2),
    Color(0xFFFF6B6B),
    Color(0xFF4ECDC4),
    Color(0xFF45B7D1),
    Color(0xFFFFA07A),
    Color(0xFF98D8C8)
)

// Text
val TextPrimary = Color(0xFFFFFFFF)
val TextSecondary = Color(0xFF8E8E93)
val TextTertiary = Color(0xFF636366)

// Divider
val Divider = Color(0xFF38383A)

fun colorFromHex(hex: String): Color {
    return try {
        val cleanHex = hex.trimStart('#')
        val colorLong = cleanHex.toLong(16)
        when (cleanHex.length) {
            6 -> Color(0xFF000000 or colorLong)
            8 -> Color(colorLong)
            else -> Primary
        }
    } catch (e: Exception) {
        Primary
    }
}
