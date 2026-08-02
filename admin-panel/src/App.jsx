import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, Server, Users, Activity, Settings as SettingsIcon,
  FileDown, LogOut, ShieldCheck,
} from "lucide-react";
import { api, clearToken, getToken } from "./api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Servers from "./pages/Servers.jsx";
import UsersPage from "./pages/Users.jsx";
import Sessions from "./pages/Sessions.jsx";
import Configs from "./pages/Configs.jsx";
import SettingsPage from "./pages/Settings.jsx";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "servers", label: "Servidores", icon: Server },
  { key: "users", label: "Usuarios", icon: Users },
  { key: "sessions", label: "Sesiones", icon: Activity },
  { key: "configs", label: "Configuraciones", icon: FileDown },
  { key: "settings", label: "Configuracion", icon: SettingsIcon },
];

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [page, setPage] = useState("dashboard");
  const [health, setHealth] = useState("VERIFICANDO");

  useEffect(() => {
    api("/health")
      .then((d) => setHealth(d.status ?? "ONLINE"))
      .catch(() => setHealth("OFFLINE"));
  }, []);

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const Current = {
    dashboard: Dashboard,
    servers: Servers,
    users: UsersPage,
    sessions: Sessions,
    configs: Configs,
    settings: SettingsPage,
  }[page];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.png" alt="CUSTOM HTTP" />
          <span>CUSTOM HTTP</span>
        </div>
        <nav className="nav">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} className={page === key ? "active" : ""} onClick={() => setPage(key)}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 24 }} className="nav">
          <button
            onClick={() => {
              api("/logout", { method: "POST" }).catch(() => {});
              clearToken();
              setAuthed(false);
            }}
          >
            <LogOut size={17} /> Cerrar sesion
          </button>
        </div>
        <div className="muted" style={{ marginTop: 18, display: "flex", gap: 6, alignItems: "center" }}>
          <ShieldCheck size={14} /> API: <span className={`badge ${health === "ONLINE" ? "on" : health === "VERIFICANDO" ? "wait" : "off"}`}>{health}</span>
        </div>
      </aside>
      <main className="main">
        <Current onUnauthorized={() => setAuthed(false)} />
      </main>
    </div>
  );
}
