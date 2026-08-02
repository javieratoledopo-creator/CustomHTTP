package com.customhttp.app

import android.app.Application
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.customhttp.app.data.*
import com.customhttp.app.net.NetworkMonitor
import com.customhttp.app.net.NetworkType
import com.customhttp.app.ui.Screen
import com.customhttp.app.ui.UiState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class MainViewModel(app: Application) : AndroidViewModel(app) {

    private val store = SessionStore(app)
    private val repo = Repository(store)
    private val monitor = NetworkMonitor(app)

    private val _state = MutableStateFlow(UiState(network = monitor.label()))
    val state: StateFlow<UiState> = _state.asStateFlow()

    private var lastConfigFile: File? = null
    private var pendingAutoConnect = false

    init {
        viewModelScope.launch {
            monitor.changes().collect { type ->
                _state.value = _state.value.copy(network = monitor.label())
                if (type != NetworkType.NONE && _state.value.loggedIn && _state.value.connection == "DESCONECTADO" && pendingAutoConnect) {
                    connect()
                }
            }
        }
        if (store.token != null) refresh()
    }

    private fun set(block: UiState.() -> UiState) { _state.value = _state.value.block() }
    private fun info(msg: String) = set { copy(message = msg, isError = false) }
    private fun err(msg: String) = set { copy(message = msg, isError = true, busy = false) }

    fun login(username: String, password: String) = viewModelScope.launch {
        set { copy(busy = true, message = "VERIFICANDO", isError = false) }
        runCatching { withContext(Dispatchers.IO) { repo.login(username, password) } }
            .onSuccess { res ->
                if (res.role != "user") { err("Esta cuenta es de administrador: usa el panel web."); return@launch }
                set {
                    copy(
                        loggedIn = true, busy = false, screen = Screen.MAIN,
                        username = res.user?.username ?: username,
                        serverName = res.server?.name ?: "",
                        serverStatus = res.server?.status ?: "VERIFICANDO",
                        tls = (res.server?.protocol ?: "https") == "https",
                        message = if (res.server?.status == "ONLINE") "SERVIDOR VERIFICADO" else "SERVIDOR NO DISPONIBLE",
                        isError = res.server?.status != "ONLINE",
                    )
                }
            }
            .onFailure { err(it.message ?: "No se pudo iniciar sesion") }
    }

    fun refresh() = viewModelScope.launch {
        set { copy(busy = true, serverStatus = "VERIFICANDO") }
        runCatching { withContext(Dispatchers.IO) { repo.me() } }
            .onSuccess { me ->
                set {
                    copy(
                        loggedIn = true, busy = false,
                        screen = if (screen == Screen.LOGIN) Screen.MAIN else screen,
                        username = me.user?.username ?: username,
                        serverName = me.server?.name ?: "",
                        serverStatus = me.server?.status ?: "OFFLINE",
                        connection = me.connection,
                        tls = (me.server?.protocol ?: "https") == "https",
                    )
                }
            }
            .onFailure {
                store.clear()
                set { copy(loggedIn = false, busy = false, screen = Screen.LOGIN, message = it.message, isError = true) }
            }
    }

    /** CONECTAR con verificacion previa del servidor y reintentos progresivos. */
    fun connect() = viewModelScope.launch {
        if (monitor.current() == NetworkType.NONE) { err("SIN CONEXION"); return@launch }
        set { copy(busy = true, connection = "CONECTANDO", serverStatus = "VERIFICANDO", message = "VERIFICANDO SERVIDOR", isError = false) }
        var delayMs = 2000L
        repeat(4) { attempt ->
            val result = runCatching { withContext(Dispatchers.IO) { repo.connect(monitor.current()) } }
            result.onSuccess { res ->
                set {
                    copy(
                        busy = false, connection = res.connection, serverStatus = res.server_status,
                        message = "CONEXION ESTABLECIDA", isError = false,
                    )
                }
                pendingAutoConnect = false
                return@launch
            }
            result.onFailure { e ->
                val code = (e as? ApiException)?.code
                if (code == "USER_DISABLED" || code == "USER_EXPIRED" || code == "SESSION_EXPIRED" || code == "NO_TOKEN") {
                    store.clear()
                    set { copy(loggedIn = false, screen = Screen.LOGIN, busy = false, connection = "DESCONECTADO", message = e.message, isError = true) }
                    return@launch
                }
                if (attempt == 3) {
                    pendingAutoConnect = true
                    set { copy(busy = false, connection = "DESCONECTADO", serverStatus = "OFFLINE", message = e.message ?: "SERVIDOR NO DISPONIBLE", isError = true) }
                } else {
                    info("REINTENTANDO (${attempt + 1})")
                    delay(delayMs)
                    delayMs *= 2
                }
            }
        }
    }

    fun disconnect() = viewModelScope.launch {
        pendingAutoConnect = false
        runCatching { withContext(Dispatchers.IO) { repo.disconnect() } }
        set { copy(connection = "DESCONECTADO", message = null) }
    }

    fun logout() = viewModelScope.launch {
        withContext(Dispatchers.IO) { runCatching { repo.logout() } }
        _state.value = UiState(network = monitor.label())
    }

    fun openSettings() = set { copy(screen = Screen.SETTINGS, message = null) }
    fun openMain() = set { copy(screen = Screen.MAIN, message = null) }

    fun verifyServer() = viewModelScope.launch {
        set { copy(serverStatus = "VERIFICANDO", message = "VERIFICANDO SERVIDOR", isError = false) }
        refresh().join()
        val online = _state.value.serverStatus == "ONLINE"
        set { copy(message = if (online) "SERVIDOR VERIFICADO" else "SERVIDOR NO DISPONIBLE", isError = !online) }
    }

    fun createConfig() = viewModelScope.launch {
        val token = repo.token ?: return@launch err("Sesion no iniciada")
        set { copy(busy = true, message = "CREANDO CONFIGURACION", isError = false) }
        runCatching {
            withContext(Dispatchers.IO) {
                val (file, name) = ConfigManager.createForSelf(token)
                ConfigManager.export(getApplication(), file, name)
            }
        }.onSuccess {
            lastConfigFile = it
            set { copy(busy = false, hasConfigFile = true, configId = it.name, message = "CONFIGURACION CREADA", isError = false) }
        }.onFailure { err(it.message ?: "No se pudo crear la configuracion") }
    }

    fun exportConfig() {
        val f = lastConfigFile ?: return err("Primero crea una configuracion")
        info("CONFIGURACION EXPORTADA: ${f.name}")
    }

    fun shareConfig(): Intent? {
        val f = lastConfigFile ?: run { err("Primero crea una configuracion"); return null }
        return ConfigManager.shareIntent(getApplication(), f)
    }

    /** Importacion automatica al abrir un archivo .chttp. */
    fun importConfig(uri: Uri) = viewModelScope.launch {
        set { copy(busy = true, message = "CONFIGURACION DETECTADA", isError = false) }
        runCatching {
            withContext(Dispatchers.IO) {
                val file = ConfigManager.readFromUri(getApplication(), uri)
                val verified = ConfigManager.verifyOnServer(file)
                verified to file
            }
        }.onSuccess { (verified, file) ->
            store.configId = (file.payload["config_id"] as? kotlinx.serialization.json.JsonPrimitive)?.content
            store.configToken = (file.payload["token"] as? kotlinx.serialization.json.JsonPrimitive)?.content
            set {
                copy(
                    busy = false,
                    configId = store.configId,
                    hasConfigFile = true,
                    serverName = verified.server?.name ?: serverName,
                    serverStatus = "ONLINE",
                    message = "CONFIGURACION IMPORTADA · SERVIDOR VERIFICADO",
                    isError = false,
                )
            }
            if (_state.value.loggedIn) connect() else pendingAutoConnect = true
        }.onFailure { err(it.message ?: "Configuracion invalida") }
    }
}
