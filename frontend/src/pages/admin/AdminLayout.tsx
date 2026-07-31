import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../auth";

export function AdminLayout() {
  const { token, user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="login-page">
        <p>Cargando panel...</p>
      </div>
    );
  }

  if (!token) return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="brand">
          Mensajes <span>ARG</span>
        </div>
        <nav>
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink to="/admin/messages">Mensajes</NavLink>
          <NavLink to="/admin/devices">Dispositivos</NavLink>
          <NavLink to="/admin/contacts">Contactos</NavLink>
          <NavLink to="/admin/logs">Logs</NavLink>
        </nav>
        <div style={{ marginTop: "auto" }}>
          <p className="muted" style={{ color: "rgba(247,250,251,0.55)", marginBottom: "0.8rem" }}>
            {user?.full_name}
            <br />
            {user?.email}
          </p>
          <button className="btn btn-ghost" type="button" onClick={logout} style={{ width: "100%" }}>
            Salir
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
