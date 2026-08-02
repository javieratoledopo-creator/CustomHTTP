package com.customhttp.app.ui

data class UiState(
    val loggedIn: Boolean = false,
    val busy: Boolean = false,
    val username: String = "",
    val serverName: String = "",
    val serverStatus: String = "VERIFICANDO",
    val connection: String = "DESCONECTADO",
    val network: String = "SIN CONEXION",
    val tls: Boolean = false,
    val message: String? = null,
    val isError: Boolean = false,
    val configId: String? = null,
    val hasConfigFile: Boolean = false,
    val screen: Screen = Screen.LOGIN,
)

enum class Screen { LOGIN, MAIN, SETTINGS }
