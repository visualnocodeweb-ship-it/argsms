import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useParams } from "react-router-dom";
import { fetchProject, type Project } from "../../api";
import { useAuth } from "../../auth";

export function ProjectLayout() {
  const { projectId } = useParams();
  const { token, user, loading, logout } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !projectId) return;
    fetchProject(token, Number(projectId))
      .then(setProject)
      .catch((err) => setError(err instanceof Error ? err.message : "Proyecto no encontrado"));
  }, [token, projectId]);

  if (loading) {
    return (
      <div className="login-page">
        <p>Cargando panel...</p>
      </div>
    );
  }
  if (!token) return <Navigate to="/admin/login" replace />;

  const base = `/admin/projects/${projectId}`;

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="brand">
          Mensajes <span>ARG</span>
        </div>
        <div className="project-chip-side">
          <span className="project-dot" style={{ background: project?.color || "#19c98a" }} />
          {project?.name || "Proyecto"}
        </div>
        <nav>
          <NavLink to={base} end>
            Dashboard
          </NavLink>
          <NavLink to={`${base}/messages`}>Mensajes</NavLink>
          <NavLink to={`${base}/devices`}>Dispositivos</NavLink>
          <NavLink to={`${base}/contacts`}>Contactos</NavLink>
          <NavLink to={`${base}/logs`}>Logs</NavLink>
          <NavLink to="/admin">← Proyectos</NavLink>
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
        {error ? <p className="error">{error}</p> : <Outlet context={{ project }} />}
      </main>
    </div>
  );
}
