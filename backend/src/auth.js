import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { one } from "./db.js";
import { fail } from "./lib/http.js";
import { sha256 } from "./lib/crypto.js";

export function signAccessToken(payload, minutes = config.sessionTtlMinutes) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: `${minutes}m` });
}

function bearer(req) {
  const h = req.headers.authorization ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

/** Requiere un token valido. Para usuarios verifica que la sesion siga activa. */
export async function requireAuth(req, res, next) {
  const token = bearer(req);
  if (!token) return fail(res, 401, "NO_TOKEN", "Token ausente");
  let claims;
  try {
    claims = jwt.verify(token, config.jwtSecret);
  } catch {
    return fail(res, 401, "INVALID_TOKEN", "Token invalido o vencido");
  }
  if (claims.role === "admin") {
    const admin = await one("select id, email, active from admins where id = $1", [claims.sub]);
    if (!admin || !admin.active) return fail(res, 401, "ADMIN_DISABLED", "Administrador no habilitado");
    req.admin = admin;
    req.auth = claims;
    return next();
  }
  const session = await one(
    `select s.*, u.username, u.active, u.expires_at as user_expires_at, u.server_id
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1`,
    [sha256(token)],
  );
  if (!session) return fail(res, 401, "NO_SESSION", "Sesion no encontrada");
  if (session.status !== "active") return fail(res, 401, "SESSION_CLOSED", "Sesion cerrada");
  if (new Date(session.expires_at) < new Date()) return fail(res, 401, "SESSION_EXPIRED", "Sesion vencida");
  if (!session.active) return fail(res, 403, "USER_DISABLED", "Usuario desactivado");
  if (session.user_expires_at && new Date(session.user_expires_at) < new Date())
    return fail(res, 403, "USER_EXPIRED", "Cuenta vencida");
  req.session = session;
  req.auth = claims;
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.auth?.role !== "admin") return fail(res, 403, "FORBIDDEN", "Solo administradores");
  return next();
}
