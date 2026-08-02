package com.customhttp.app.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.customhttp.app.R

@Composable
fun LoginScreen(
    busy: Boolean,
    error: String?,
    onLogin: (String, String) -> Unit,
) {
    var user by remember { mutableStateOf("") }
    var pass by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Image(painterResource(R.drawable.logo), contentDescription = "CUSTOM HTTP", modifier = Modifier.size(120.dp))
        Spacer(Modifier.height(14.dp))
        Text("CUSTOM HTTP", color = White, fontSize = 24.sp, fontWeight = FontWeight.Bold, letterSpacing = 3.sp)
        Spacer(Modifier.height(28.dp))

        OutlinedTextField(
            value = user,
            onValueChange = { user = it },
            label = { Text("USUARIO", color = Muted) },
            leadingIcon = { Icon(Icons.Filled.Person, null, tint = Sky) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = pass,
            onValueChange = { pass = it },
            label = { Text("CONTRASENA", color = Muted) },
            leadingIcon = { Icon(Icons.Filled.Lock, null, tint = Sky) },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions.Default,
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        if (error != null) {
            Spacer(Modifier.height(12.dp))
            Text(error, color = Bad, textAlign = TextAlign.Center, fontSize = 13.sp)
        }
        Spacer(Modifier.height(22.dp))
        Button(
            onClick = { onLogin(user.trim(), pass) },
            enabled = !busy && user.isNotBlank() && pass.isNotBlank(),
            modifier = Modifier.fillMaxWidth().height(50.dp),
        ) {
            Icon(Icons.Filled.Login, null)
            Spacer(Modifier.width(8.dp))
            Text(if (busy) "VERIFICANDO" else "INICIAR SESION", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        }
    }
}
