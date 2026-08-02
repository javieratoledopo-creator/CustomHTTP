import { Router } from "express";
import { one } from "../db.js";
import { config } from "../config.js";
import { asyncHandler, ok } from "../lib/http.js";

export const healthRouter = Router();

/** GET /health  -> publico, usado por la app y por VERIFICAR SERVIDOR. */
healthRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    let db = false;
    try {
      await one("select 1 as ok");
      db = true;
    } catch {
      db = false;
    }
    return ok(res, {
      service: "CUSTOM HTTP",
      status: db ? "ONLINE" : "DEGRADED",
      database: db,
      env: config.env,
      time: new Date().toISOString(),
    });
  }),
);
