import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query, one } from "../db.js";
import { config } from "../config.js";
import { signAccessToken } from "../auth.js";
import { asyncHandler, fail, ok, validate } from "../lib/http.js";
import { sha256 } from "../lib/crypto.js";
import { probeServer } from "../lib/probe.js";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(6).max(200),
});

/** POST /login  -> admin (por email) o usuario (por username). */
authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = validate(loginSchema, req.body, res);
    if (!body) return;
    const identity = body.username.toLowerCase();

    const admin = await one("select * from admins where lower(email) = $1", [identity]);
    if (admin) {
      if (!admin.active) return fail(res, 403, "ADMIN_DISABLED", "Administrador desactivado");
      if (!(await bcrypt.compare(body.password, admin.password_hash)))
        return fail(res, 401, "BAD_CREDENTIALS", "Usuario o contrasena incorrectos");
      const token = signAccessToken({ sub: admin.id, role: "admin", email: admin.email }, 240);
      await query("update admins set last_login_at = now() where id = $1", [admin.id]);
      return ok(res, { role: "admin", token, admin: { id: admin.id, email: admin.email } });
    }

    const user = await one("select * from users where lower(username) = $1", [identity]);
    if (!user || !(await bcrypt.compare(body.password, user.password_hash)))
      return fail(res, 401, "BAD_CREDENTIALS", "Usuario o contrasena incorrectos");
    if (!user.active) return fail(res, 403, "USER_DISABLED", "Cuenta desactivada");
    if (user.expires_at && new Date(user.expires_at) < new Date())
      return fail(res, 403, "USER_EXPIRED", "Cuenta vencida");
    if (user.starts_at && new Date(user.starts_at) > new Date())
      return fail(res, 403, "USER_NOT_STARTED", "Cuenta aun no vigente");

    const server = user.server_id ? await one("select * from servers where id = $1", [user.server_id]) : null;
    if (!server) return fail(res, 409, "NO_SERVER", "El usuario no tiene servidor asignado");
    if (!server.active) return fail(res, 409, "SERVER_DISABLED", "Servidor desactivado");

    const limit = user.max_sessions ?? config.maxSessionsDefault;
    const { rows: actives } = await query(
      "select id from sessions where user_id = $1 and status = 'active' and expires_at > now() order by created_at asc",
      [user.id],
    );
    if (limit > 0 && actives.length >= limit) {
      const excess = actives.slice(0, actives.length - limit + 1).map((r) => r.id);
      await query("update sessions set status = 'closed', closed_at = now() where id = any($1::uuid[])", [excess]);
    }

    const expiresAt = new Date(Date.now() + config.sessionTtlMinutes * 60_000);
    const token = signAccessToken({ sub: user.id, role: "user", username: user.username });
    const session = await one(
      `insert into sessions (user_id, server_id, token_hash, expires_at, status, ip, user_agent)
       values ($1,$2,$3,$4,'active',$5,$6) returning id, created_at, expires_at`,
      [user.id, server.id, sha256(token), expiresAt, req.ip, req.headers["user-agent"] ?? null],
    );

    const health = await probeServer(server);
    return ok(res, {
      role: "user",
      token,
      session,
      user: {
        id: user.id,
        username: user.username,
        active: user.active,
        expires_at: user.expires_at,
      },
      server: {
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        protocol: server.protocol,
        https_url: server.https_url,
        status: health.online ? "ONLINE" : "OFFLINE",
      },
    });
  }),
);

/** POST /logout */
authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const h = req.headers.authorization ?? "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (token) {
      await query(
        "update sessions set status = 'closed', closed_at = now() where token_hash = $1 and status = 'active'",
        [sha256(token)],
      );
    }
    return ok(res, {});
  }),
);
