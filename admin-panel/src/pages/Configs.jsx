import React, { useEffect, useState } from "react";
import { Ban, RefreshCw, Upload, ShieldCheck } from "lucide-react";
import { api } from "../api.js";

export default function Configs() {
  const [configs, setConfigs] = useState([]);
  const [error, setError] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  const load = () => api("/configs").then((d) => setConfigs(d.configs)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function revoke(configId) {
    try { await api("/configs/revoke", { method: "POST", body: { config_id: configId } }); load(); }
    catch (e) { setError(e.message); }
  }

  /** Verificacion manual de un archivo .chttp (firma, vigencia, revocacion). */
  async function verifyFile(file) {
    setError(""); setVerifyResult(null);
    try {
      const parsed = JSON.parse(await file.text());
      const d = await api("/configs/verify", { method: "POST", body: parsed });
      setVerifyResult(d);
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="topbar">
        <h1>Configuraciones .chttp</h1>
        <div className="row">
          <label className="btn ghost" style={{ marginBottom: 0 }}>
            <Upload size={15} /> Verificar archivo
            <input type="file" accept=".chttp,application/json" style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && verifyFile(e.target.files[0])} />
          </label>
          <button className="btn ghost" onClick={load}><RefreshCw size={15} /> Actualizar</button>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {verifyResult && (
        <div className="panel">
          <h2><ShieldCheck size={16} /> {verifyResult.status}</h2>
          <pre>{JSON.stringify(verifyResult, null, 2)}</pre>
        </div>
      )}
      <div className="panel">
        <p className="muted">Las configuraciones se generan desde Usuarios · Crear configuracion. Contienen un token temporal firmado, nunca contrasenas.</p>
        <table>
          <thead>
            <tr><th>Identificador</th><th>Usuario</th><th>Servidor</th><th>Estado</th><th>Expira</th><th>Creada</th><th></th></tr>
          </thead>
          <tbody>
            {configs.map((c) => {
              const expired = new Date(c.expires_at) < new Date();
              return (
                <tr key={c.id}>
                  <td>{c.config_id}</td>
                  <td>{c.username}</td>
                  <td>{c.server_name ?? "-"}</td>
                  <td>
                    <span className={`badge ${c.revoked || expired ? "off" : "on"}`}>
                      {c.revoked ? "REVOCADA" : expired ? "VENCIDA" : "VIGENTE"}
                    </span>
                  </td>
                  <td>{new Date(c.expires_at).toLocaleString()}</td>
                  <td>{new Date(c.created_at).toLocaleString()}</td>
                  <td>{!c.revoked && <button className="btn danger sm" onClick={() => revoke(c.config_id)}><Ban size={13} /> Revocar</button>}</td>
                </tr>
              );
            })}
            {!configs.length && <tr><td colSpan={7} className="muted">Sin configuraciones generadas.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
