package com.customhttp.app.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

val Black = Color(0xFF04070D)
val Panel = Color(0xFF0A1120)
val Blue = Color(0xFF0B63F6)
val Sky = Color(0xFF38BDF8)
val White = Color(0xFFFFFFFF)
val Muted = Color(0xFF8AA2C4)
val Ok = Color(0xFF22C55E)
val Bad = Color(0xFFEF4444)

private val scheme = darkColorScheme(
    primary = Blue,
    onPrimary = White,
    secondary = Sky,
    onSecondary = Black,
    background = Black,
    onBackground = White,
    surface = Panel,
    onSurface = White,
    error = Bad,
)

@Composable
fun CustomHttpTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = scheme,
        typography = Typography(),
        shapes = MaterialTheme.shapes.copy(medium = RoundedCornerShape(14.dp)),
        content = content,
    )
}
