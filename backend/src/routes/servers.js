import { Router } from "express";
import { z } from "zod";
import { query, one } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";
import { asyncHandler, fail, ok, validate } from "../lib/http.js";
import { probeServer } from "../lib/probe.js";

export const serversRouter = Router();
serversRouter.use(requireAuth, requireAdmin);

const serverSchema = z.object({
  name: z.string().trim().min(2).max(80),
  host: z.string().trim().min(3).max(255),
  port: z.coerce.number().int().min(1).max(65535).default(443),
  protocol: z.enum(["https", "http", "tls", "ws", "wss"]).default("https"),
  https_url: z.string().url().max(300).optional().or(z.literal("")),
  active: z.boolean().default(true),
  description: z.string().max(500).optional().or(z.literal("")),
});

serversRouter.get(
  "/servers",
  asyncHandler(async (_req, res) => {
    const { rows } = await query("select * from servers order by created_at desc");
    return ok(res, { servers: rows });
  }),
);

serversRouter.post(
  "/servers",
  asyncHandler(async (req, res) => {
    const b = validate(serverSchema, req.body, res);
    if (!b) return;
    const row = await one(
      `insert into servers (name, host, port, protocol, https_url, active, description)
       values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [b.name, b.host, b.port, b.protocol, b.https_url || null, b.active, b.description || null],
    );
    return ok(res, { server: row });
  }),
);

serversRouter.put(
  "/servers/:id",
  asyncHandler(async (req, res) => {
    const b = validate(serverSchema.partial(), req.body, res);
    if (!b) return;
    const current = await one("select * from servers where id = $1", [req.params.id]);
    if (!current) return fail(res, 404, "NOT_FOUND", "Servidor no encontrado");
    const merged = { ...current, ...b };
    const row = await one(
      `update servers set name=$2, host=$3, port=$4, protocol=$5, https_url=$6, active=$7, description=$8,
              updated_at = now() where id = $1 returning *`,
      [req.params.id, merged.name, merged.host, merged.port, merged.protocol, merged.https_url || null, merged.active, merged.description || null],
    );
    return ok(res, { server: row });
  }),
);

serversRouter.delete(
  "/servers/:id",
  asyncHandler(async (req, res) => {
    const row = await one("delete from servers where id = $1 returning id", [req.params.id]);
    if (!row) return fail(res, 404, "NOT_FOUND", "Servidor no encontrado");
    return ok(res, { deleted: row.id });
  }),
);

/** ACTIVAR / DESACTIVAR */
serversRouter.post(
  "/servers/:id/active",
  asyncHandler(async (req, res) => {
    const active = Boolean(req.body?.active);
    const row = await one("update servers set active = $2, updated_at = now() where id = $1 returning *", [req.params.id, active]);
    if (!row) return fail(res, 404, "NOT_FOUND", "Servidor no encontrado");
    return ok(res, { server: row });
  }),
);

/** VERIFICAR SERVIDOR */
serversRouter.post(
  "/servers/:id/verify",
  asyncHandler(async (req, res) => {
    const server = await one("select * from servers where id = $1", [req.params.id]);
    if (!server) return fail(res, 404, "NOT_FOUND", "Servidor no encontrado");
    const health = await probeServer(server);
    await query("update servers set last_status = $2, last_checked_at = now() where id = $1", [
      server.id,
      health.online ? "ONLINE" : "OFFLINE",
    ]);
    return ok(res, { status: health.online ? "ONLINE" : "OFFLINE", health });
  }),
);
