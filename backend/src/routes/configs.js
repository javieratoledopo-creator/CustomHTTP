import { Router } from "express";
import { z } from "zod";
import { query, one } from "../db.js";
import { config } from "../config.js";
import { requireAuth } from "../auth.js";
import { asyncHandler, fail, ok, validate } from "../lib/http.js";
import { randomToken, sha256, signPayload, verifySignature } from "../lib/crypto.js";

export const configsRouter = Router();

/**
 * POST /configs  -> CREAR CONFIGURACION (.chttp)
 * El admin puede generarla para cualquier usuario; un usuario solo para si mismo.
 * Nunca incluye contrasenas: solo un token temporal revocable + firma HMAC.
 */
configsRouter.post(
  "/configs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = validate(
      z.object({
        user_id: z.string().uuid().optional(),
        ttl_hours: z.coerce.number().int().min(1).max(8760).optional(),
      }),
      req.body ?? {},
      res,
    );
    if (!body) return;

    const isAdmin = req.auth.role === "admin";
    const userId = isAdmin ? body.user_id : req.session?.user_id;
    if (!userId) return fail(res, 400, "NO_USER", "Falta user_id");

    const user = await one("select * from users where id = $1", [userId]);
    if (!user) return fail(res, 404, "NOT_FOUND", "Usuario no encontrado");
    if (!user.active) return fail(res, 409, "USER_DISABLED", "Usuario desactivado");
    const server = user.server_id ? await one("select * from servers where id = $1", [user.server_id]) : null;
    if (!server) return fail(res, 409, "NO_SERVER", "El usuario no tiene servidor asignado");

    const ttlHours = body.ttl_hours ?? config.configTtlHours;
    const expiresAt = new Date(Date.now() + ttlHours * 3_600_000);
    const accessToken = randomToken(32);
    const configId = `chttp_${randomToken(8)}`;

    const payload = {
      config_id: configId,
      server_id: server.id,
      server_url: server.https_url || `${server.protocol}://${server.host}`,
      host: server.host,
      port: Number(server.port),
      protocol: server.protocol,
      user_id: user.id,
      username: user.username,
      token: accessToken,
      expires_at: expiresAt.toISOString(),
      api_url: config.apiUrl,
    };
    const signature = signPayload(payload);

    const row = await one(
      `insert into configs (user_id, server_id, config_id, token_hash, expires_at, revoked, created_by)
       values ($1,$2,$3,$4,$5,false,$6) returning id, config_id, expires_at, created_at`,
      [user.id, server.id, configId, sha256(accessToken), expiresAt, isAdmin ? req.admin.email : user.username],
    );

    return ok(res, {
      config: row,
      file_name: `${user.username}-${configId}.chttp`,
      file: { version: 1, type: "customhttp-config", payload, signature, alg: "HMAC-SHA256" },
    });
  }),
);

/** POST /configs/verify -> publico: valida firma, vigencia, revocacion y permisos. */
configsRouter.post(
  "/configs/verify",
  asyncHandler(async (req, res) => {
    const body = validate(
      z.object({
        version: z.number().optional(),
        type: z.string().optional(),
        payload: z.record(z.any()),
        signature: z.string().min(10),
      }),
      req.body ?? {},
      res,
    );
    if (!body) return;

    if (!verifySignature(body.payload, body.signature))
      return fail(res, 400, "BAD_SIGNATURE", "La configuracion fue modificada o no es autentica");

    const stored = await one("select * from configs where config_id = $1", [body.payload.config_id]);
    if (!stored) return fail(res, 404, "CONFIG_NOT_FOUND", "Configuracion desconocida");
    if (stored.revoked) return fail(res, 403, "CONFIG_REVOKED", "Configuracion revocada");
    if (new Date(stored.expires_at) < new Date()) return fail(res, 403, "CONFIG_EXPIRED", "Configuracion vencida");
    if (stored.token_hash !== sha256(String(body.payload.token ?? "")))
      return fail(res, 400, "BAD_TOKEN", "Token de configuracion invalido");

    const user = await one("select * from users where id = $1", [stored.user_id]);
    if (!user || !user.active) return fail(res, 403, "USER_DISABLED", "Usuario no autorizado");
    if (user.expires_at && new Date(user.expires_at) < new Date())
      return fail(res, 403, "USER_EXPIRED", "Cuenta vencida");
    if (user.server_id !== stored.server_id)
      return fail(res, 403, "SERVER_MISMATCH", "El servidor ya no esta asignado a este usuario");

    const server = await one("select * from servers where id = $1", [stored.server_id]);
    if (!server || !server.active) return fail(res, 409, "SERVER_DISABLED", "SERVIDOR NO DISPONIBLE");

    await query("update configs set verified_at = now(), verify_count = verify_count + 1 where id = $1", [stored.id]);

    return ok(res, {
      status: "CONFIGURACION VERIFICADA",
      username: user.username,
      server: { id: server.id, name: server.name, host: server.host, port: server.port, protocol: server.protocol },
      expires_at: stored.expires_at,
    });
  }),
);

/** POST /configs/revoke */
configsRouter.post(
  "/configs/revoke",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = validate(z.object({ config_id: z.string().min(4) }), req.body ?? {}, res);
    if (!body) return;
    const stored = await one("select * from configs where config_id = $1", [body.config_id]);
    if (!stored) return fail(res, 404, "NOT_FOUND", "Configuracion no encontrada");
    if (req.auth.role !== "admin" && stored.user_id !== req.session?.user_id)
      return fail(res, 403, "FORBIDDEN", "Sin permiso");
    await query("update configs set revoked = true, revoked_at = now() where id = $1", [stored.id]);
    return ok(res, { revoked: stored.config_id });
  }),
);

/** GET /configs -> listado para el panel. */
configsRouter.get(
  "/configs",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.auth.role !== "admin") return fail(res, 403, "FORBIDDEN", "Solo administradores");
    const { rows } = await query(
      `select c.id, c.config_id, c.expires_at, c.revoked, c.created_at, c.verified_at,
              u.username, s.name as server_name
         from configs c join users u on u.id = c.user_id
         left join servers s on s.id = c.server_id
        order by c.created_at desc limit 200`,
    );
    return ok(res, { configs: rows });
  }),
);
