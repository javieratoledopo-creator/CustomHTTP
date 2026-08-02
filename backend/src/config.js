import dotenv from "dotenv";
dotenv.config();

function req(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 8080),
  apiUrl: process.env.API_URL ?? "",
  serverUrl: process.env.SERVER_URL ?? "",
  databaseUrl: req("DATABASE_URL"),
  jwtSecret: req("JWT_SECRET"),
  configSigningSecret: req("CONFIG_SIGNING_SECRET"),
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  sessionTtlMinutes: Number(process.env.SESSION_TTL_MINUTES ?? 720),
  configTtlHours: Number(process.env.CONFIG_TTL_HOURS ?? 168),
  maxSessionsDefault: Number(process.env.MAX_SESSIONS_DEFAULT ?? 1),
  corsOrigins: (process.env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  tlsCertPath: process.env.TLS_CERT_PATH ?? "",
  tlsKeyPath: process.env.TLS_KEY_PATH ?? "",
};
