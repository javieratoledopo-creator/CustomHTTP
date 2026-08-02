package com.customhttp.app.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.customhttp.app.BuildConfig
import com.customhttp.app.R

@Composable
fun SettingsScreen(
    state: UiState,
    onCreateConfig: () -> Unit,
    onExportConfig: () -> Unit,
    onShareConfig: () -> Unit,
    onImportConfig: () -> Unit,
    onVerifyServer: () -> Unit,
    onBack: () -> Unit,
) {
    Column(Modifier.fillMaxSize().padding(22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Image(painterResource(R.drawable.logo), contentDescription = "CUSTOM HTTP", modifier = Modifier.size(72.dp))
        Text("CONFIGURACION", color = White, fontSize = 16.sp, fontWeight = FontWeight.Bold, letterSpacing = 3.sp)
        Spacer(Modifier.height(18.dp))

        Card(colors = CardDefaults.cardColors(containerColor = Panel), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text("API: ${BuildConfig.API_URL}", color = Muted, fontSize = 12.sp)
                Text("SERVIDOR: ${state.serverName.ifBlank { "SIN ASIGNAR" }}", color = Muted, fontSize = 12.sp)
                Text("ESTADO: ${state.serverStatus}", color = Muted, fontSize = 12.sp)
                Text("RED: ${state.network}", color = Muted, fontSize = 12.sp)
                state.configId?.let { Text("CONFIGURACION: $it", color = Sky, fontSize = 12.sp) }
            }
        }
        Spacer(Modifier.height(16.dp))

        Button(onClick = onCreateConfig, modifier = Modifier.fillMaxWidth().height(48.dp)) {
            Icon(Icons.Filled.NoteAdd, null); Spacer(Modifier.width(8.dp)); Text("CREAR CONFIGURACION")
        }
        Spacer(Modifier.height(10.dp))
        OutlinedButton(onClick = onExportConfig, enabled = state.hasConfigFile, modifier = Modifier.fillMaxWidth().height(46.dp)) {
            Icon(Icons.Filled.Download, null); Spacer(Modifier.width(8.dp)); Text("EXPORTAR CONFIGURACION")
        }
        Spacer(Modifier.height(10.dp))
        OutlinedButton(onClick = onShareConfig, enabled = state.hasConfigFile, modifier = Modifier.fillMaxWidth().height(46.dp)) {
            Icon(Icons.Filled.Share, null); Spacer(Modifier.width(8.dp)); Text("COMPARTIR ARCHIVO")
        }
        Spacer(Modifier.height(10.dp))
        OutlinedButton(onClick = onImportConfig, modifier = Modifier.fillMaxWidth().height(46.dp)) {
            Icon(Icons.Filled.Upload, null); Spacer(Modifier.width(8.dp)); Text("IMPORTAR CONFIGURACION")
        }
        Spacer(Modifier.height(10.dp))
        OutlinedButton(onClick = onVerifyServer, modifier = Modifier.fillMaxWidth().height(46.dp)) {
            Icon(Icons.Filled.Verified, null); Spacer(Modifier.width(8.dp)); Text("VERIFICAR SERVIDOR")
        }

        if (state.message != null) {
            Spacer(Modifier.height(14.dp))
            Text(state.message, color = if (state.isError) Bad else Sky, fontSize = 13.sp)
        }

        Spacer(Modifier.weight(1f))
        TextButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Sky); Spacer(Modifier.width(6.dp)); Text("VOLVER", color = Sky) }
    }
}
