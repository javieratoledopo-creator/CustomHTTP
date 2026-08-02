package com.customhttp.app.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/** Guarda el token de sesion cifrado. Nunca guarda la contrasena del usuario. */
class SessionStore(context: Context) {

    private val prefs = run {
        val key = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "customhttp_secure",
            key,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    var token: String?
        get() = prefs.getString("token", null)
        set(value) = prefs.edit().apply { if (value == null) remove("token") else putString("token", value) }.apply()

    var username: String?
        get() = prefs.getString("username", null)
        set(value) = prefs.edit().putString("username", value).apply()

    /** Token temporal importado desde un archivo .chttp. */
    var configToken: String?
        get() = prefs.getString("config_token", null)
        set(value) = prefs.edit().putString("config_token", value).apply()

    var configId: String?
        get() = prefs.getString("config_id", null)
        set(value) = prefs.edit().putString("config_id", value).apply()

    fun clear() = prefs.edit().clear().apply()
}
