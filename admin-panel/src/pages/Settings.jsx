import React, { useEffect, useState } from "react";
import { Save, Lock } from "lucide-react";
import { api } from "../api.js";

const FIELDS = [
  ["api_url", "URL de API"],
  ["main_domain", "Dominio principal"],
  ["session_ttl_minutes", "Tiempo de sesion (minutos)"],
  ["config_ttl_hours", "Vigencia de configuraciones (horas)"],
  ["require_https", "Exigir HTTPS (true/false)"],
  ["allow_user_config_export", "Permitir exportar configuracion al usuario (true/false)"],
];

export default function SettingsPage() {
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api("/settings")
      .then((d) => setValues(Object.fromEntries(d.settings.map((s) => [s.key, s.value]))))
      .catch((e) => setError(e.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError(""); setNotice("");
    try {
      const d = await api("/settings", { method: "PUT", body: values });
      setValues(Object.fromEntries(d.settings.map((s) => [s.key, s.value])));
      setNotice("Configuracion guardada.");
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <div className="topbar"><h1>Configuracion</h1></div>
      {error && <div className="error">{error}</div>}
      {notice && <div className="muted">{notice}</div>}
      <form className="panel" onSubmit={save}>
        <div className="grid2">
          {FIELDS.map(([key, label]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
            </div>
          ))}
        </div>
        <button className="btn"><Save size={15} /> Guardar</button>
      </form>
      <div className="panel">
        <h2><Lock size={16} /> Seguridad</h2>
        <p className="muted">
          Los secretos (JWT_SECRET, CONFIG_SIGNING_SECRET, DATABASE_URL, credenciales del administrador) se
          configuran unicamente por variables de entorno en el archivo .env del servidor y no se muestran aqui.
        </p>
      </div>
    </>
  );
}
