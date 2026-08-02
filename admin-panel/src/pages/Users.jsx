import React, { useEffect, useState } from "react";
import { Plus, Save, Trash2, Power, X, LogOut, Server as ServerIcon, FileDown } from "lucide-react";
import { api } from "../api.js";

const EMPTY = {
  username: "", password: "", server_id: "", active: true,
  starts_at: "", expires_at: "", max_sessions: 1, notes: "",
};

const toInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [servers, setServers] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = () => {
    api("/users").then((d) => setUsers(d.users)).catch((e) => setError(e.message));
    api("/servers").then((d) => setServers(d.servers)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    const body = {
      username: form.username,
      server_id: form.server_id || null,
      active: form.active,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      max_sessions: form.max_sessions === "" ? null : Number(form.max_sessions),
      notes: form.notes,
    };
    if (form.password) body.password = form.password;
    try {
      if (form.id) await api(`/users/${form.id}`, { method: "PUT", body });
      else await api("/users", { method: "POST", body: { ...body, password: form.password } });
      setForm(null);
      load();
    } catch (err) { setError(err.message); }
  }

  async function act(fn, msg) {
    setError(""); setNotice("");
    try { await fn(); if (msg) setNotice(msg); load(); } catch (err) { setError(err.message); }
  }

  /** CREAR CONFIGURACION + EXPORTAR archivo .chttp */
  async function createConfig(user) {
    setError(""); setNotice("");
    try {
      const d = await api("/configs", { method: "POST", body: { user_id: user.id } });
      const blob = new Blob([JSON.stringify(d.file, null, 2)], { type: "application/vnd.customhttp.config" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = d.file_name;
      a.click();
      URL.revokeObjectURL(url);
      setNotice(`Configuracion creada y exportada: ${d.file_name}`);
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <div className="topbar">
        <h1>Usuarios</h1>
        <button className="btn" onClick={() => setForm({ ...EMPTY })}><Plus size={15} /> Crear usuario</button>
      </div>
      {error && <div className="error">{error}</div>}
      {notice && <div className="muted">{notice}</div>}

      {form && (
        <form className="panel" onSubmit={save}>
          <div className="topbar">
            <h2>{form.id ? "Editar usuario" : "Crear usuario"}</h2>
            <button type="button" className="btn ghost sm" onClick={() => setForm(null)}><X size={14} /> Cancelar</button>
          </div>
          <div className="grid2">
            <div className="field"><label>Nombre de usuario</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
            <div className="field">
              <label>{form.id ? "Nueva contrasena (opcional)" : "Contrasena"}</label>
              <input type="password" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!form.id} minLength={6} />
            </div>
            <div className="field">
              <label>Servidor asignado</label>
              <select value={form.server_id ?? ""} onChange={(e) => setForm({ ...form, server_id: e.target.value })} required>
                <option value="">Seleccionar</option>
                {servers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Estado</label>
              <select value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}>
                <option value="true">Activo</option><option value="false">Inactivo</option>
              </select>
            </div>
            <div className="field"><label>Fecha de inicio</label><input type="date" value={toInput(form.starts_at)} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
            <div className="field"><label>Fecha de expiracion</label><input type="date" value={toInput(form.expires_at)} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
            <div className="field"><label>Limite de sesiones (0 = sin limite)</label><input type="number" min={0} value={form.max_sessions ?? ""} onChange={(e) => setForm({ ...form, max_sessions: e.target.value })} /></div>
          </div>
          <div className="field"><label>Notas</label><textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <button className="btn"><Save size={15} /> Guardar</button>
        </form>
      )}

      <div className="panel">
        <table>
          <thead>
            <tr><th>Usuario</th><th>Servidor</th><th>Estado</th><th>Sesiones</th><th>Inicio</th><th>Expira</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.server_name ?? "-"}</td>
                <td><span className={`badge ${u.active ? "on" : "off"}`}>{u.active ? "ACTIVO" : "INACTIVO"}</span></td>
                <td>{u.active_sessions ?? 0}{u.max_sessions ? ` / ${u.max_sessions}` : ""}</td>
                <td>{u.starts_at ? new Date(u.starts_at).toLocaleDateString() : "-"}</td>
                <td>{u.expires_at ? new Date(u.expires_at).toLocaleDateString() : "-"}</td>
                <td>
                  <div className="row">
                    <button className="btn ghost sm" onClick={() => setForm({ ...u, password: "" })}>Editar</button>
                    <button className="btn ghost sm" onClick={() => act(() => api(`/users/${u.id}/active`, { method: "POST", body: { active: !u.active } }))}>
                      <Power size={13} /> {u.active ? "Desactivar" : "Activar"}
                    </button>
                    <button className="btn ghost sm" onClick={() => act(() => api(`/users/${u.id}/close-sessions`, { method: "POST" }), "Sesiones cerradas")}>
                      <LogOut size={13} /> Cerrar sesiones
                    </button>
                    <select
                      style={{ width: 150 }}
                      value=""
                      onChange={(e) => e.target.value && act(() => api(`/users/${u.id}/server`, { method: "POST", body: { server_id: e.target.value } }), "Servidor cambiado")}
                    >
                      <option value="">Cambiar servidor</option>
                      {servers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button className="btn sky sm" onClick={() => createConfig(u)}><FileDown size={13} /> Crear configuracion</button>
                    <button className="btn danger sm" onClick={() => confirm(`Eliminar ${u.username}?`) && act(() => api(`/users/${u.id}`, { method: "DELETE" }))}>
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={7} className="muted"><ServerIcon size={13} /> Sin usuarios todavia.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
