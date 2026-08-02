# API CUSTOM HTTP

Base: `https://api.midominio.com`. Todas las respuestas son JSON con `ok: true|false`.
Autenticacion: `Authorization: Bearer <token>` (JWT). Errores: `{ ok:false, code, message }`.

| Metodo | Ruta | Acceso | Descripcion |
| --- | --- | --- | --- |
| GET | /health | publico | Estado del servicio y base de datos |
| POST | /login | publico | Login unificado (admin por email, usuario por username) |
| POST | /logout | token | Cierra la sesion actual |
| GET | /me | usuario | Servidor asignado, estado y sesion |
| POST | /connect | usuario | Verifica servidor y autoriza la conexion |
| POST | /disconnect | usuario | Marca la desconexion |
| GET | /servers | admin | Lista servidores |
| POST | /servers | admin | Crea servidor |
| PUT | /servers/:id | admin | Edita servidor |
| DELETE | /servers/:id | admin | Elimina servidor |
| POST | /servers/:id/active | admin | Activa / desactiva |
| POST | /servers/:id/verify | admin | Verifica servidor (ONLINE/OFFLINE) |
| GET | /users | admin | Lista usuarios |
| POST | /users | admin | Crea usuario |
| PUT | /users/:id | admin | Edita usuario |
| DELETE | /users/:id | admin | Elimina usuario |
| POST | /users/:id/active | admin | Activa / desactiva |
| POST | /users/:id/close-sessions | admin | Cierra sesiones del usuario |
| POST | /users/:id/server | admin | Cambia el servidor asignado |
| GET | /sessions | admin | Sesiones activas o historial (`?status=all`) |
| POST | /sessions/:id/close | admin | Cierra una sesion |
| GET | /configs | admin | Lista configuraciones .chttp |
| POST | /configs | token | Crea configuracion firmada |
| POST | /configs/verify | publico | Verifica firma, vigencia y revocacion |
| POST | /configs/revoke | token | Revoca una configuracion |
| GET | /dashboard | admin | Metricas y ultimas conexiones |
| POST | /dashboard/verify-all | admin | Verifica todos los servidores |
| GET/PUT | /settings | admin | Configuracion del sistema |

## Formato del archivo `.chttp`
```json
{
  "version": 1,
  "type": "customhttp-config",
  "payload": {
    "config_id": "chttp_xxxxxxxx",
    "server_id": "uuid",
    "server_url": "https://servidor.midominio.com",
    "host": "servidor.midominio.com",
    "port": 443,
    "protocol": "https",
    "user_id": "uuid",
    "username": "usuario",
    "token": "token temporal revocable",
    "expires_at": "2026-01-01T00:00:00.000Z",
    "api_url": "https://api.midominio.com"
  },
  "signature": "HMAC-SHA256 base64url del payload canonico",
  "alg": "HMAC-SHA256"
}
```
No contiene contrasenas. La firma se calcula con `CONFIG_SIGNING_SECRET` y solo se valida en el servidor.
