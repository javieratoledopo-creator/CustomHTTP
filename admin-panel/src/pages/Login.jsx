import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { api, setToken } from "../api.js";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/login", { method: "POST", body: { username, password } });
      if (data.role !== "admin") {
        setError("Esta cuenta es de usuario. Ingresa desde la aplicacion Android.");
        return;
      }
      setToken(data.token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="box" onSubmit={submit}>
        <img src="/logo.png" alt="CUSTOM HTTP" />
        <h1>CUSTOM HTTP</h1>
        <p className="muted" style={{ marginTop: 0 }}>Panel de administracion</p>
        <div className="field" style={{ textAlign: "left", marginTop: 20 }}>
          <label>Usuario</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div className="field" style={{ textAlign: "left" }}>
          <label>Contrasena</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn" style={{ width: "100%", justifyContent: "center" }} disabled={busy}>
          <LogIn size={16} /> {busy ? "Verificando" : "Iniciar sesion"}
        </button>
      </form>
    </div>
  );
}
