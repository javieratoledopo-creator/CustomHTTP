export function ok(res, data) {
  return res.json({ ok: true, ...data });
}

export function fail(res, status, code, message) {
  return res.status(status).json({ ok: false, code, message });
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function validate(schema, payload, res) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    fail(res, 400, "VALIDATION_ERROR", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    return null;
  }
  return parsed.data;
}
