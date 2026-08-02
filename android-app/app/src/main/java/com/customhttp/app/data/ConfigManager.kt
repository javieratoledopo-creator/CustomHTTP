package com.customhttp.app.data

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.customhttp.app.net.ApiClient
import kotlinx.serialization.json.Json
import java.io.File

/** Lectura, verificacion, exportacion y comparticion de archivos .chttp. */
object ConfigManager {

    private val json = Json { ignoreUnknownKeys = true; prettyPrint = true }

    fun readFromUri(context: Context, uri: Uri): ConfigFile {
        val text = context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
            ?: throw ApiException("READ_ERROR", "No se pudo leer el archivo")
        return json.decodeFromString(ConfigFile.serializer(), text)
    }

    /** La firma se valida en el servidor: el secreto nunca viaja en el APK. */
    fun verifyOnServer(file: ConfigFile): VerifyConfigResponse {
        val body = json.encodeToString(ConfigFile.serializer(), file)
        val res = ApiClient.post("/configs/verify", body)
        return ApiClient.json.decodeFromString(VerifyConfigResponse.serializer(), res)
    }

    /** CREAR CONFIGURACION desde la app (para el propio usuario). */
    fun createForSelf(token: String): Pair<ConfigFile, String> {
        val res = ApiClient.post("/configs", "{}", token)
        val root = ApiClient.json.parseToJsonElement(res)
        val obj = root as kotlinx.serialization.json.JsonObject
        val file = ApiClient.json.decodeFromJsonElement(ConfigFile.serializer(), obj["file"]!!)
        val name = (obj["file_name"] as? kotlinx.serialization.json.JsonPrimitive)?.content ?: "customhttp.chttp"
        return file to name
    }

    /** EXPORTAR CONFIGURACION al almacenamiento de la app. */
    fun export(context: Context, file: ConfigFile, fileName: String): File {
        val dir = File(context.cacheDir, "configs").apply { mkdirs() }
        val out = File(dir, fileName)
        out.writeText(json.encodeToString(ConfigFile.serializer(), file))
        return out
    }

    /** COMPARTIR ARCHIVO mediante el selector del sistema. */
    fun shareIntent(context: Context, file: File): Intent {
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        return Intent.createChooser(
            Intent(Intent.ACTION_SEND).apply {
                type = "application/vnd.customhttp.config"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            },
            "COMPARTIR CONFIGURACION",
        )
    }
}
