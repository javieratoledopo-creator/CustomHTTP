package com.customhttp.app.net

import com.customhttp.app.BuildConfig
import com.customhttp.app.data.ApiException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/** Cliente HTTPS del backend CUSTOM HTTP. */
object ApiClient {

    val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    private val client = OkHttpClient.Builder()
        .connectTimeout(12, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private val base = BuildConfig.API_URL.trimEnd('/')
    private val jsonType = "application/json; charset=utf-8".toMediaType()

    private fun exec(request: Request): String {
        client.newCall(request).execute().use { res ->
            val body = res.body?.string().orEmpty()
            if (!res.isSuccessful) {
                val parsed = runCatching { json.parseToJsonElement(body).jsonObject() }.getOrNull()
                throw ApiException(
                    parsed?.get("code")?.jsonPrimitive?.content,
                    parsed?.get("message")?.jsonPrimitive?.content ?: "Error ${res.code}",
                )
            }
            return body
        }
    }

    private fun kotlinx.serialization.json.JsonElement.jsonObject(): JsonObject = this as JsonObject

    fun get(path: String, token: String? = null): String {
        val builder = Request.Builder().url("$base$path").get()
        token?.let { builder.header("Authorization", "Bearer $it") }
        return exec(builder.build())
    }

    fun post(path: String, bodyJson: String = "{}", token: String? = null): String {
        val builder = Request.Builder().url("$base$path").post(bodyJson.toRequestBody(jsonType))
        token?.let { builder.header("Authorization", "Bearer $it") }
        return exec(builder.build())
    }

    /** Comprueba /health del backend o de un servidor concreto (VERIFICANDO SERVIDOR). */
    fun health(url: String = base): Boolean = runCatching {
        client.newCall(Request.Builder().url("${url.trimEnd('/')}/health").get().build()).execute().use { it.isSuccessful }
    }.getOrDefault(false)
}
