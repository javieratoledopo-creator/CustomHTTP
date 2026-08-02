package com.customhttp.app.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.customhttp.app.R

@Composable
private fun StatusRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String, color: Color) {
    Card(colors = CardDefaults.cardColors(containerColor = Panel), modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp)) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = Sky)
            Spacer(Modifier.width(12.dp))
            Text(label, color = Muted, fontSize = 12.sp, letterSpacing = 1.sp, modifier = Modifier.weight(1f))
            Text(value, color = color, fontSize = 14.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        }
    }
}

@Composable
fun MainScreen(
    state: UiState,
    onConnect: () -> Unit,
    onDisconnect: () -> Unit,
    onSettings: () -> Unit,
    onLogout: () -> Unit,
) {
    val serverColor = when (state.serverStatus) {
        "ONLINE" -> Ok
        "OFFLINE" -> Bad
        else -> Sky
    }
    val connColor = when (state.connection) {
        "CONECTADO" -> Ok
        "CONECTANDO" -> Sky
        else -> Muted
    }

    Column(Modifier.fillMaxSize().padding(22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Image(painterResource(R.drawable.logo), contentDescription = "CUSTOM HTTP", modifier = Modifier.size(84.dp))
        Text("CUSTOM HTTP", color = White, fontSize = 18.sp, fontWeight = FontWeight.Bold, letterSpacing = 3.sp)
        Spacer(Modifier.height(20.dp))

        StatusRow(Icons.Filled.Dns, "SERVIDOR", state.serverName.ifBlank { "SIN ASIGNAR" }, White)
        StatusRow(Icons.Filled.Verified, "ESTADO DEL SERVIDOR", state.serverStatus, serverColor)
        StatusRow(Icons.Filled.Link, "CONEXION", state.connection, connColor)
        StatusRow(
            if (state.network == "WI-FI") Icons.Filled.Wifi else Icons.Filled.SignalCellularAlt,
            "RED", state.network, Sky,
        )
        StatusRow(Icons.Filled.Person, "USUARIO", state.username.ifBlank { "-" }, White)
        StatusRow(Icons.Filled.Security, "SEGURIDAD", if (state.tls) "TLS ACTIVO" else "SIN VERIFICAR", if (state.tls) Ok else Muted)

        if (state.message != null) {
            Spacer(Modifier.height(8.dp))
            Text(state.message, color = if (state.isError) Bad else Sky, fontSize = 13.sp)
        }

        Spacer(Modifier.weight(1f))

        Button(onClick = onConnect, enabled = !state.busy && state.connection != "CONECTADO", modifier = Modifier.fillMaxWidth().height(50.dp)) {
            Icon(Icons.Filled.PlayArrow, null); Spacer(Modifier.width(8.dp)); Text("CONECTAR", fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(10.dp))
        OutlinedButton(onClick = onDisconnect, enabled = state.connection == "CONECTADO", modifier = Modifier.fillMaxWidth().height(48.dp)) {
            Icon(Icons.Filled.Stop, null); Spacer(Modifier.width(8.dp)); Text("DESCONECTAR")
        }
        Spacer(Modifier.height(10.dp))
        Row(Modifier.fillMaxWidth()) {
            OutlinedButton(onClick = onSettings, modifier = Modifier.weight(1f).height(46.dp)) {
                Icon(Icons.Filled.Settings, null); Spacer(Modifier.width(6.dp)); Text("CONFIGURACION")
            }
            Spacer(Modifier.width(10.dp))
            OutlinedButton(onClick = onLogout, modifier = Modifier.weight(1f).height(46.dp)) {
                Icon(Icons.Filled.Logout, null); Spacer(Modifier.width(6.dp)); Text("CERRAR SESION")
            }
        }
    }
}
