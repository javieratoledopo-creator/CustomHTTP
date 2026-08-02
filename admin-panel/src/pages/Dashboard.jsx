import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Wifi, Smartphone } from "lucide-react";
import { api } from "../api.js";

const CARDS = [
  ["active_users", "Usuarios activos"],
  ["connected_users", "Usuarios conectados"],
  ["active_sessions", "Sesiones activas"],
  ["servers_online", "Servidores online"],
  ["servers_offline", "Servidores offline"],
  ["active_configs", "Configuraciones vigentes"],
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api("/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  async function verifyAll() {
    setBusy(true);
    try {
      await api("/dashboard/verify-all", { method: "POST" });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <h1>Dashboard</h1>
        <button className="btn ghost" onClick={verifyAll} disabled={busy}>
          <RefreshCw size={15} /> {busy ? "Verificando" : "Verificar servidores"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="cards">
        {CARDS.map(([key, label]) => (
          <div className="card" key={key}>
            <div className="label">{label}</div>
            <div className="value">{data?.stats?.[key] ?? "-"}</div>
          </div>
        ))}
      </div>
      <div className="panel">
        <h2>Ultimas conexiones</h2>
        <table>
          <thead>
            <tr><th>Usuario</th><th>Servidor</th><th>Evento</th><th>Red</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            {(data?.last_connections ?? []).map((c, i) => (
              <tr key={i}>
                <td>{c.username}</td>
                <td>{c.server_name ?? "-"}</td>
                <td><span className={`badge ${c.event === "connect" ? "on" : "off"}`}>{c.event === "connect" ? "CONECTADO" : "DESCONECTADO"}</span></td>
                <td>
                  <span className="row">
                    {c.network_type === "WIFI" ? <Wifi size={14} /> : c.network_type === "MOBILE" ? <Smartphone size={14} /> : null}
                    {c.network_type ?? "-"}
                  </span>
                </td>
                <td>{new Date(c.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!data?.last_connections?.length && <tr><td colSpan={5} className="muted">Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
