import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query, one } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";
import { asyncHandler, fail, ok, validate } from "../lib/http.js";

export const usersRouter = Router();
usersRouter.use(requireAuth, requireAdmin);

const createSchema = z.object({
  username: z.string().trim().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/, "solo letras, numeros, . _ -"),
  password: z.string().min(6).max(200),
  server_id: z.string().uuid().nullable().optional(),
  active: z.boolean().default(true),
  starts_at: z.coerce.date().nullable().optional(),
  expires_at: z.coerce.date().nullable().optional(),
  max_sessions: z.coerce.number().int().min(0).max(50).nullable().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

const publicUser = `id, username, server_id, active, starts_at, expires_at, max_sessions, notes, created_at, updated_at`;

usersRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `select u.id, u.username, u.server_id, u.active, u.starts_at, u.expires_at,
              u.max_sessions, u.notes, u.created_at, u.updated_at,
              s.name as server_name,
              (select count(*) from sessions x
                where x.user_id = u.id and x.status = 'active' and x.expires_at > now()) as active_sessions
         from users u left join servers s on s.id = u.server_id
        order by u.created_at desc`,
    );
    return ok(res, { users: rows });
  }),
);

usersRouter.post(
  "/users",
  asyncHandler(async (req, res) => {
    const b = validate(createSchema, req.body, res);
    if (!b) return;
    const exists = await one("select id from users where lower(username) = lower($1)", [b.username]);
    if (exists) return fail(res, 409, "USERNAME_TAKEN", "El nombre de usuario ya existe");
    if (b.server_id) {
      const srv = await one("select id from servers where id = $1", [b.server_id]);
      if (!srv) return fail(res, 400, "BAD_SERVER", "Servidor inexistente");
    }
    const hash = await bcrypt.hash(b.password, 12);
    const row = await one(
      `insert into users (username, password_hash, server_id, active, starts_at, expires_at, max_sessions, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning ${publicUser}`,
      [b.username, hash, b.server_id ?? null, b.active, b.starts_at ?? null, b.expires_at ?? null, b.max_sessions ?? null, b.notes || null],
    );
    return ok(res, { user: row });
  }),
);

usersRouter.put(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const b = validate(createSchema.partial(), req.body, res);
    if (!b) return;
    const current = await one("select * from users where id = $1", [req.params.id]);
    if (!current) return fail(res, 404, "NOT_FOUND", "Usuario no encontrado");
    const m = { ...current, ...b };
    const hash = b.password ? await bcrypt.hash(b.password, 12) : current.password_hash;
    const row = await one(
      `update users set username=$2, password_hash=$3, server_id=$4, active=$5, starts_at=$6,
              expires_at=$7, max_sessions=$8, notes=$9, updated_at=now()
        where id=$1 returning ${publicUser}`,
      [req.params.id, m.username, hash, m.server_id ?? null, m.active, m.starts_at ?? null, m.expires_at ?? null, m.max_sessions ?? null, m.notes || null],
    );
    return ok(res, { user: row });
  }),
);

usersRouter.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const row = await one("delete from users where id = $1 returning id", [req.params.id]);
    if (!row) return fail(res, 404, "NOT_FOUND", "Usuario no encontrado");
    return ok(res, { deleted: row.id });
  }),
);

usersRouter.post(
  "/users/:id/active",
  asyncHandler(async (req, res) => {
    const active = Boolean(req.body?.active);
    const row = await one(`update users set active=$2, updated_at=now() where id=$1 returning ${publicUser}`, [req.params.id, active]);
    if (!row) return fail(res, 404, "NOT_FOUND", "Usuario no encontrado");
    if (!active) await query("update sessions set status='closed', closed_at=now() where user_id=$1 and status='active'", [req.params.id]);
    return ok(res, { user: row });
  }),
);

/** CERRAR SESIONES */
usersRouter.post(
  "/users/:id/close-sessions",
  asyncHandler(async (req, res) => {
    const { rowCount } = await query(
      "update sessions set status='closed', closed_at=now() where user_id=$1 and status='active'",
      [req.params.id],
    );
    return ok(res, { closed: rowCount });
  }),
);

/** CAMBIAR SERVIDOR */
usersRouter.post(
  "/users/:id/server",
  asyncHandler(async (req, res) => {
    const parsed = validate(z.object({ server_id: z.string().uuid() }), req.body, res);
    if (!parsed) return;
    const srv = await one("select id from servers where id = $1", [parsed.server_id]);
    if (!srv) return fail(res, 400, "BAD_SERVER", "Servidor inexistente");
    const row = await one(`update users set server_id=$2, updated_at=now() where id=$1 returning ${publicUser}`, [req.params.id, parsed.server_id]);
    if (!row) return fail(res, 404, "NOT_FOUND", "Usuario no encontrado");
    await query("update configs set revoked = true where user_id = $1 and revoked = false", [req.params.id]);
    return ok(res, { user: row });
  }),
);
