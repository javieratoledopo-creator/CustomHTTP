import React, { useCallback, useEffect, useState } from "react";
import { XCircle, RefreshCw } from "lucide-react";
import { api } from "../api.js";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [all, setAll] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api(`/sessions${all ? "?status=all" : ""}`).then((d) => setSessions(d.sessions)).catch((e) => setError(e.message));
  }, [all]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function close(id) {
    try { await api(`/sessions/${id}/close`, { method: "POST" }); load(); } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="topbar">
        <h1>Sesiones</h1>
        <div className="row">
          <button className="btn ghost" onClick={() => setAll(!all)}>{all ? "Ver solo activas" : "Ver historial"}</button>
          <button className="btn ghost" onClick={load}><RefreshCw size={15} /> Actualizar</button>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="panel">
        <table>
          <thead>
            <tr><th>Usuario</th><th>Servidor</th><th>Estado</th><th>Conexion</th><th>Red</th><th>IP</th><th>Inicio</th><th>Expira</th><th></th></tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.username}</td>
                <td>{s.server_name ?? "-"}</td>
                <td><span className={`badge ${s.status === "active" ? "on" : "off"}`}>{s.status === "active" ? "ACTIVA" : "CERRADA"}</span></td>
                <td><span className={`badge ${s.connected_at && !s.disconnected_at ? "on" : "off"}`}>{s.connected_at && !s.disconnected_at ? "CONECTADO" : "DESCONECTADO"}</span></td>
                <td>{s.network_type ?? "-"}</td>
                <td>{s.ip ?? "-"}</td>
                <td>{new Date(s.created_at).toLocaleString()}</td>
                <td>{new Date(s.expires_at).toLocaleString()}</td>
                <td>
                  {s.status === "active" && (
                    <button className="btn danger sm" onClick={() => close(s.id)}><XCircle size={13} /> Cerrar</button>
                  )}
                </td>
              </tr>
            ))}
            {!sessions.length && <tr><td colSpan={9} className="muted">Sin sesiones.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
