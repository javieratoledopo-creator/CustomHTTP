package com.customhttp.app.net

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

enum class NetworkType { WIFI, MOBILE, NONE }

/** Detecta Wi-Fi / datos moviles / sin conexion con APIs oficiales de Android. */
class NetworkMonitor(private val context: Context) {

    private val cm get() = context.getSystemService(ConnectivityManager::class.java)

    fun current(): NetworkType {
        val caps = cm?.getNetworkCapabilities(cm?.activeNetwork ?: return NetworkType.NONE)
            ?: return NetworkType.NONE
        return when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> NetworkType.WIFI
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> NetworkType.MOBILE
            else -> NetworkType.NONE
        }
    }

    fun label(): String = when (current()) {
        NetworkType.WIFI -> "WI-FI"
        NetworkType.MOBILE -> "DATOS MOVILES"
        NetworkType.NONE -> "SIN CONEXION"
    }

    fun changes(): Flow<NetworkType> = callbackFlow {
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) { trySend(current()) }
            override fun onLost(network: Network) { trySend(current()) }
            override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) { trySend(current()) }
        }
        cm?.registerDefaultNetworkCallback(callback)
        trySend(current())
        awaitClose { cm?.unregisterNetworkCallback(callback) }
    }
}
