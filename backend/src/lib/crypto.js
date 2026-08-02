import crypto from "crypto";
import { config } from "../config.js";

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

/** Firma HMAC-SHA256 en base64url del payload canonico de una configuracion. */
export function signPayload(payload) {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto
    .createHmac("sha256", config.configSigningSecret)
    .update(canonical)
    .digest("base64url");
}

export function verifySignature(payload, signature) {
  const expected = signPayload(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature ?? ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
