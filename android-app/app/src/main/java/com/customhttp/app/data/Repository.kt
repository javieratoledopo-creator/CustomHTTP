package com.customhttp.app.data

import com.customhttp.app.net.ApiClient
import com.customhttp.app.net.NetworkType

/** Puente entre la interfaz y la API. */
class Repository(private val store: SessionStore) {

    val token: String? get() = store.token

    fun login(username: String, password: String): LoginResponse {
        val body = """{"username":${quote(username)},"password":${quote(password)}}"""
        val res = ApiClient.post("/login", body)
        val parsed = ApiClient.json.decodeFromString(LoginResponse.serializer(), res)
        store.token = parsed.token
        store.username = parsed.user?.username
        return parsed
    }

    fun me(): MeResponse {
        val t = store.token ?: throw ApiException("NO_TOKEN", "Sesion no iniciada")
        return ApiClient.json.decodeFromString(MeResponse.serializer(), ApiClient.get("/me", t))
    }

    fun connect(network: NetworkType): ConnectResponse {
        val t = store.token ?: throw ApiException("NO_TOKEN", "Sesion no iniciada")
        val body = """{"network_type":"${network.name.let { if (it == "NONE") "NONE" else it }}"}"""
        return ApiClient.json.decodeFromString(ConnectResponse.serializer(), ApiClient.post("/connect", body, t))
    }

    fun disconnect() {
        store.token?.let { ApiClient.post("/disconnect", "{}", it) }
    }

    fun logout() {
        runCatching { store.token?.let { ApiClient.post("/logout", "{}", it) } }
        store.clear()
    }

    fun serverHealth(server: ServerInfo?): Boolean {
        val url = server?.https_url ?: server?.let { "${it.protocol}://${it.host}" } ?: return false
        return ApiClient.health(url)
    }

    private fun quote(v: String) = "\"" + v.replace("\\", "\\\\").replace("\"", "\\\"") + "\""
}
