import { Router } from "express";
import { z } from "zod";
import { query, one } from "../db.js";
import { requireAuth } from "../auth.js";
import { asyncHandler, fail, ok, validate } from "../lib/http.js";
import { probeServer } from "../lib/probe.js";

export const connectionRouter = Router();
connectionRouter.use(requireAuth);

/** GET /me -> estado para la pantalla principal de la app. */
connectionRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!req.session) return fail(res, 403, "USER_ONLY", "Solo usuarios");
    const server = await one("select * from servers where id = $1", [req.session.server_id]);
    const health = server ? await probeServer(server) : { online: false };
    return ok(res, {
      user: { id: req.session.user_id, username: req.session.username, expires_at: req.session.user_expires_at },
      session: { id: req.session.id, expires_at: req.session.expires_at, status: req.session.status },
      server: server && {
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        protocol: server.protocol,
        https_url: server.https_url,
        active: server.active,
        status: health.online ? "ONLINE" : "OFFLINE",
      },
      connection: req.session.connected_at && !req.session.disconnected_at ? "CONECTADO" : "DESCONECTADO",
    });
  }),
);

/** POST /connect -> verifica servidor, permisos y vigencia antes de autorizar. */
connectionRouter.post(
  "/connect",
  asyncHandler(async (req, res) => {
    if (!req.session) return fail(res, 403, "USER_ONLY", "Solo usuarios");
    const body = validate(
      z.object({ network_type: z.enum(["WIFI", "MOBILE", "NONE", "UNKNOWN"]).default("UNKNOWN") }),
      req.body ?? {},
      res,
    );
    if (!body) return;

    const server = await one("select * from servers where id = $1", [req.session.server_id]);
    if (!server) return fail(res, 409, "NO_SERVER", "Sin servidor asignado");
    if (!server.active) return fail(res, 409, "SERVER_DISABLED", "SERVIDOR NO DISPONIBLE");

    const health = await probeServer(server);
    await query("update servers set last_status=$2, last_checked_at=now() where id=$1", [
      server.id,
      health.online ? "ONLINE" : "OFFLINE",
    ]);
    if (!health.online) return fail(res, 503, "SERVER_OFFLINE", "SERVIDOR NO DISPONIBLE");

    await query(
      `update sessions set connected_at = now(), disconnected_at = null, network_type = $2 where id = $1`,
      [req.session.id, body.network_type],
    );
    await query(
      `insert into connection_log (session_id, user_id, server_id, event, network_type, ip)
       values ($1,$2,$3,'connect',$4,$5)`,
      [req.session.id, req.session.user_id, server.id, body.network_type, req.ip],
    );

    return ok(res, {
      connection: "CONECTADO",
      server_status: "ONLINE",
      endpoint: {
        host: server.host,
        port: server.port,
        protocol: server.protocol,
        url: health.url.replace(/\/health$/, ""),
      },
      health,
    });
  }),
);

/** POST /disconnect */
connectionRouter.post(
  "/disconnect",
  asyncHandler(async (req, res) => {
    if (!req.session) return fail(res, 403, "USER_ONLY", "Solo usuarios");
    await query("update sessions set disconnected_at = now() where id = $1", [req.session.id]);
    await query(
      `insert into connection_log (session_id, user_id, server_id, event, ip)
       values ($1,$2,$3,'disconnect',$4)`,
      [req.session.id, req.session.user_id, req.session.server_id, req.ip],
    );
    return ok(res, { connection: "DESCONECTADO" });
  }),
);
