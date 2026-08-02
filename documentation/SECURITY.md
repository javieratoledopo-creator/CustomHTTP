# Seguridad

- HTTPS/TLS obligatorio: Nginx + certbot, HSTS, redireccion 308 de http a https y
  `cleartextTrafficPermitted="false"` en Android.
- Contrasenas con bcrypt (coste 12). Nunca se guardan en texto plano ni se devuelven por la API.
- Tokens JWT temporales; el hash SHA-256 del token se guarda en `sessions` para permitir revocacion.
- Expiracion de sesiones (`SESSION_TTL_MINUTES`) y limite de sesiones por usuario.
- Configuraciones `.chttp` firmadas con HMAC-SHA256 (`CONFIG_SIGNING_SECRET`), con vigencia y revocacion.
  Cualquier modificacion del archivo invalida la firma (`BAD_SIGNATURE`).
- El token de configuracion se guarda hasheado en la base y en el dispositivo con EncryptedSharedPreferences.
- Validacion de toda la entrada con Zod; limite de tamano de cuerpo (256 kB).
- Rate limiting: 20 intentos de login cada 10 minutos, 240 peticiones por minuto en el resto.
- Panel protegido por JWT de administrador; los usuarios normales no pueden entrar.
- Control de permisos: cada usuario solo puede usar el servidor que el administrador le asigno; al cambiar
  de servidor se revocan sus configuraciones.
- Helmet (nosniff, frameguard), CORS restringido a `CORS_ORIGINS`.
- Todos los secretos por variables de entorno. El repositorio no incluye claves ni contrasenas reales.
