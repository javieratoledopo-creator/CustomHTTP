import { Router } from "express";
import { query, one } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";
import { asyncHandler, fail, ok } from "../lib/http.js";

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth, requireAdmin);

sessionsRouter.get(
  "/sessions",
  asyncHandler(async (req, res) => {
    const onlyActive = req.query.status !== "all";
    const { rows } = await query(
      `select s.id, s.user_id, s.server_id, s.status, s.created_at, s.expires_at, s.closed_at,
              s.connected_at, s.disconnected_at, s.network_type, s.ip,
              u.username, sv.name as server_name
         from sessions s
         join users u on u.id = s.user_id
         left join servers sv on sv.id = s.server_id
        ${onlyActive ? "where s.status = 'active' and s.expires_at > now()" : ""}
        order by s.created_at desc limit 200`,
    );
    return ok(res, { sessions: rows });
  }),
);

sessionsRouter.post(
  "/sessions/:id/close",
  asyncHandler(async (req, res) => {
    const row = await one(
      "update sessions set status='closed', closed_at=now() where id=$1 returning id, status",
      [req.params.id],
    );
    if (!row) return fail(res, 404, "NOT_FOUND", "Sesion no encontrada");
    return ok(res, { session: row });
  }),
);
