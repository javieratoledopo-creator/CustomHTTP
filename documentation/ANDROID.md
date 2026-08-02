# Aplicacion Android

- Kotlin, Jetpack Compose, Material 3, OkHttp, kotlinx.serialization, EncryptedSharedPreferences.
- minSdk 24, targetSdk/compileSdk 34, Java 17, Gradle 8.9, AGP 8.5.2.
- Permisos: INTERNET, ACCESS_NETWORK_STATE, FOREGROUND_SERVICE. No se tocan APN, SIM ni operador.

## Pantallas
1. Inicio/login: logo, CUSTOM HTTP, USUARIO, CONTRASENA, INICIAR SESION.
2. Principal: SERVIDOR, ESTADO DEL SERVIDOR (VERIFICANDO/ONLINE/OFFLINE), CONEXION
   (DESCONECTADO/CONECTANDO/CONECTADO), RED (WI-FI / DATOS MOVILES), USUARIO, SEGURIDAD, y los botones
   CONECTAR, DESCONECTAR, CONFIGURACION, CERRAR SESION.
3. Configuracion: CREAR CONFIGURACION, EXPORTAR CONFIGURACION, COMPARTIR ARCHIVO,
   IMPORTAR CONFIGURACION, VERIFICAR SERVIDOR.

## Archivos .chttp
Registrados en el manifest por extension (`.*\.chttp`), por MIME propio
`application/vnd.customhttp.config` y por ACTION_SEND. Al abrirlos, `MainActivity.handleIntent` los detecta,
el servidor valida firma/vigencia/permisos y la app conecta automaticamente cuando esta autorizado.

## Red y reconexion
`NetworkMonitor` usa `ConnectivityManager.registerDefaultNetworkCallback` para Wi-Fi, datos moviles y
sin conexion. `MainViewModel.connect()` reintenta con retroceso progresivo (2s, 4s, 8s) y reconecta cuando
la red vuelve.

## Compilar
```bash
cp app.properties.example app.properties   # API_URL
./gradlew assembleDebug
./gradlew assembleRelease   # requiere tu keystore
```
