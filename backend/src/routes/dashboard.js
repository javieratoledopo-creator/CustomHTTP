import { Router } from "express";
import { query, one } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";
import { asyncHandler, ok, validate } from "../lib/http.js";
import { z } from "zod";
import { probeServer } from "../lib/probe.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth, requireAdmin);

dashboardRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const stats = await one(`
      select
        (select count(*) from users where active) as active_users,
        (select count(distinct user_id) from sessions
          where status='active' and expires_at > now() and connected_at is not null and disconnected_at is null) as connected_users,
        (select count(*) from sessions where status='active' and expires_at > now()) as active_sessions,
        (select count(*) from servers where active) as servers_enabled,
        (select count(*) from servers where last_status='ONLINE') as servers_online,
        (select count(*) from servers where last_status='OFFLINE') as servers_offline,
        (select count(*) from configs where revoked = false and expires_at > now()) as active_configs
    `);
    const { rows: last } = await query(`
      select l.event, l.network_type, l.created_at, u.username, s.name as server_name
        from connection_log l
        join users u on u.id = l.user_id
        left join servers s on s.id = l.server_id
       order by l.created_at desc limit 15
    `);
    return ok(res, { stats, last_connections: last });
  }),
);

/** Verifica todos los servidores y actualiza su estado. */
dashboardRouter.post(
  "/dashboard/verify-all",
  asyncHandler(async (_req, res) => {
    const { rows } = await query("select * from servers");
    const results = [];
    for (const server of rows) {
      const health = await probeServer(server);
      await query("update servers set last_status=$2, last_checked_at=now() where id=$1", [
        server.id,
        health.online ? "ONLINE" : "OFFLINE",
      ]);
      results.push({ id: server.id, name: server.name, status: health.online ? "ONLINE" : "OFFLINE" });
    }
    return ok(res, { results });
  }),
);

/** CONFIGURACION del sistema (clave/valor). */
dashboardRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const { rows } = await query("select key, value, updated_at from settings order by key");
    return ok(res, { settings: rows });
  }),
);

dashboardRouter.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const body = validate(z.record(z.string().max(500)), req.body ?? {}, res);
    if (!body) return;
    for (const [key, value] of Object.entries(body)) {
      await query(
        `insert into settings (key, value) values ($1,$2)
         on conflict (key) do update set value = excluded.value, updated_at = now()`,
        [key, value],
      );
    }
    const { rows } = await query("select key, value, updated_at from settings order by key");
    return ok(res, { settings: rows });
  }),
);
