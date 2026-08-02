import React, { useEffect, useState } from "react";
import { Plus, Save, Trash2, Power, ShieldCheck, X } from "lucide-react";
import { api } from "../api.js";

const EMPTY = { name: "", host: "", port: 443, protocol: "https", https_url: "", active: true, description: "" };

export default function Servers() {
  const [servers, setServers] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(null);

  const load = () => api("/servers").then((d) => setServers(d.servers)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      const body = { ...form, port: Number(form.port) };
      if (form.id) await api(`/servers/${form.id}`, { method: "PUT", body });
      else await api("/servers", { method: "POST", body });
      setForm(null);
      load();
    } catch (err) { setError(err.message); }
  }

  async function act(fn) {
    setError("");
    try { await fn(); load(); } catch (err) { setError(err.message); }
  }

  async function verify(id) {
    setChecking(id);
    try {
      const d = await api(`/servers/${id}/verify`, { method: "POST" });
      setServers((prev) => prev.map((s) => (s.id === id ? { ...s, last_status: d.status } : s)));
    } catch (err) { setError(err.message); } finally { setChecking(null); }
  }

  return (
    <>
      <div className="topbar">
        <h1>Servidores</h1>
        <button className="btn" onClick={() => setForm({ ...EMPTY })}><Plus size={15} /> Agregar servidor</button>
      </div>
      {error && <div className="error">{error}</div>}

      {form && (
        <form className="panel" onSubmit={save}>
          <div className="topbar">
            <h2>{form.id ? "Editar servidor" : "Agregar servidor"}</h2>
            <button type="button" className="btn ghost sm" onClick={() => setForm(null)}><X size={14} /> Cancelar</button>
          </div>
          <div className="grid2">
            <div className="field"><label>Nombre</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="field"><label>Dominio / IP</label><input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required /></div>
            <div className="field"><label>Puerto</label><input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} required /></div>
            <div className="field">
              <label>Protocolo</label>
              <select value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}>
                {["https", "http", "tls", "wss", "ws"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field"><label>URL HTTPS</label><input value={form.https_url ?? ""} placeholder="https://servidor.midominio.com" onChange={(e) => setForm({ ...form, https_url: e.target.value })} /></div>
            <div className="field">
              <label>Estado</label>
              <select value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}>
                <option value="true">Activo</option><option value="false">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="field"><label>Descripcion</label><textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <button className="btn"><Save size={15} /> Guardar</button>
        </form>
      )}

      <div className="panel">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Host</th><th>Puerto</th><th>Protocolo</th><th>Habilitado</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {servers.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.host}</td>
                <td>{s.port}</td>
                <td>{s.protocol}</td>
                <td><span className={`badge ${s.active ? "on" : "off"}`}>{s.active ? "ACTIVO" : "INACTIVO"}</span></td>
                <td><span className={`badge ${checking === s.id ? "wait" : s.last_status === "ONLINE" ? "on" : "off"}`}>{checking === s.id ? "VERIFICANDO" : s.last_status ?? "SIN VERIFICAR"}</span></td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="row">
                    <button className="btn ghost sm" onClick={() => setForm({ ...s })}>Editar</button>
                    <button className="btn sky sm" onClick={() => verify(s.id)}><ShieldCheck size={13} /> Verificar</button>
                    <button className="btn ghost sm" onClick={() => act(() => api(`/servers/${s.id}/active`, { method: "POST", body: { active: !s.active } }))}>
                      <Power size={13} /> {s.active ? "Desactivar" : "Activar"}
                    </button>
                    <button className="btn danger sm" onClick={() => confirm(`Eliminar ${s.name}?`) && act(() => api(`/servers/${s.id}`, { method: "DELETE" }))}>
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!servers.length && <tr><td colSpan={8} className="muted">Sin servidores. Agrega el primero.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
