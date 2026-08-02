/** Comprueba que un servidor responda y que su TLS sea valido (para https). */
export async function probeServer(server, timeoutMs = 6000) {
  const base =
    server.https_url ||
    `${server.protocol === "http" ? "http" : "https"}://${server.host}${
      server.port && ![80, 443].includes(Number(server.port)) ? `:${server.port}` : ""
    }`;
  const url = `${base.replace(/\/+$/, "")}/health`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    return {
      online: res.ok,
      status: res.status,
      tls: url.startsWith("https://"),
      latency_ms: Date.now() - startedAt,
      url,
    };
  } catch (err) {
    return { online: false, status: 0, tls: false, latency_ms: Date.now() - startedAt, url, error: String(err.message ?? err) };
  } finally {
    clearTimeout(timer);
  }
}
