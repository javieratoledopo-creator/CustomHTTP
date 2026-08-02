package com.customhttp.app.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class ServerInfo(
    val id: String = "",
    val name: String = "",
    val host: String = "",
    val port: Int = 443,
    val protocol: String = "https",
    val https_url: String? = null,
    val status: String = "VERIFICANDO",
)

@Serializable
data class UserInfo(
    val id: String = "",
    val username: String = "",
    val expires_at: String? = null,
)

@Serializable
data class LoginResponse(
    val ok: Boolean = false,
    val role: String = "user",
    val token: String = "",
    val user: UserInfo? = null,
    val server: ServerInfo? = null,
)

@Serializable
data class MeResponse(
    val ok: Boolean = false,
    val user: UserInfo? = null,
    val server: ServerInfo? = null,
    val connection: String = "DESCONECTADO",
)

@Serializable
data class ConnectResponse(
    val ok: Boolean = false,
    val connection: String = "DESCONECTADO",
    val server_status: String = "OFFLINE",
)

/** Archivo .chttp: payload firmado. Nunca contiene contrasenas. */
@Serializable
data class ConfigFile(
    val version: Int = 1,
    val type: String = "customhttp-config",
    val payload: JsonObject,
    val signature: String,
    val alg: String = "HMAC-SHA256",
)

@Serializable
data class VerifyConfigResponse(
    val ok: Boolean = false,
    val status: String = "",
    val username: String = "",
    val server: ServerInfo? = null,
    val expires_at: String? = null,
)

class ApiException(val code: String?, message: String) : Exception(message)
