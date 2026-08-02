import fs from "fs";
import http from "http";
import https from "https";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { serversRouter } from "./routes/servers.js";
import { usersRouter } from "./routes/users.js";
import { sessionsRouter } from "./routes/sessions.js";
import { connectionRouter } from "./routes/connection.js";
import { configsRouter } from "./routes/configs.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { fail } from "./lib/http.js";

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "256kb" }));
app.use(morgan(config.env === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : true,
    credentials: false,
  }),
);

// // Fuerza HTTPS detras de un proxy inverso (Nginx / Caddy).
// app.use((req, res, next) => {
//   if (config.env === "production" && req.headers["x-forwarded-proto"] === "http") {
//     return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
//   }
//   return next();
// });

const loginLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 100, standardHeaders: true });
const apiLimiter = rateLimit({ windowMs: 60_000, limit: 240, standardHeaders: true });

app.use("/", healthRouter);
app.use("/", loginLimiter, authRouter);
app.use("/", apiLimiter, connectionRouter);
app.use("/", apiLimiter, serversRouter);
app.use("/", apiLimiter, usersRouter);
app.use("/", apiLimiter, sessionsRouter);
app.use("/", apiLimiter, configsRouter);
app.use("/", apiLimiter, dashboardRouter);

app.use((req, res) => fail(res, 404, "NOT_FOUND", `Ruta no encontrada: ${req.method} ${req.path}`));
app.use((err, _req, res, _next) => {
  console.error(err);
  return fail(res, 500, "INTERNAL_ERROR", "Error interno del servidor");
});

if (config.tlsCertPath && config.tlsKeyPath) {
  https
    .createServer({ cert: fs.readFileSync(config.tlsCertPath), key: fs.readFileSync(config.tlsKeyPath) }, app)
    .listen(config.port, () => console.log(`CUSTOM HTTP API (HTTPS) en :${config.port}`));
} else {
  http.createServer(app).listen(config.port, () => console.log(`CUSTOM HTTP API en :${config.port}`));
}
