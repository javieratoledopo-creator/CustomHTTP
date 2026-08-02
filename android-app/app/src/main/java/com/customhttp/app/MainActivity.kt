package com.customhttp.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.customhttp.app.ui.*

class MainActivity : ComponentActivity() {

    private val vm: MainViewModel by viewModels()

    private val pickFile = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri?.let { vm.importConfig(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setTheme(R.style.Theme_CustomHttp)
        handleIntent(intent)

        setContent {
            CustomHttpTheme {
                val state by vm.state.collectAsState()
                Surface(Modifier.fillMaxSize()) {
                    when (state.screen) {
                        Screen.LOGIN -> LoginScreen(
                            busy = state.busy,
                            error = if (state.isError) state.message else null,
                            onLogin = vm::login,
                        )
                        Screen.MAIN -> MainScreen(
                            state = state,
                            onConnect = { vm.connect() },
                            onDisconnect = { vm.disconnect() },
                            onSettings = { vm.openSettings() },
                            onLogout = { vm.logout() },
                        )
                        Screen.SETTINGS -> SettingsScreen(
                            state = state,
                            onCreateConfig = { vm.createConfig() },
                            onExportConfig = { vm.exportConfig() },
                            onShareConfig = { vm.shareConfig()?.let(::startActivity) },
                            onImportConfig = { pickFile.launch(arrayOf("*/*")) },
                            onVerifyServer = { vm.verifyServer() },
                            onBack = { vm.openMain() },
                        )
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    /** Detecta automaticamente un archivo .chttp abierto o compartido. */
    private fun handleIntent(intent: Intent?) {
        val uri = when (intent?.action) {
            Intent.ACTION_VIEW -> intent.data
            Intent.ACTION_SEND -> intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            else -> null
        }
        uri?.let { vm.importConfig(it) }
    }
}
