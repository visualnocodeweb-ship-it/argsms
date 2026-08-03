import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useParams } from "react-router-dom";
import { fetchProject, fetchProjects, type Project } from "../../api";
import { useAuth } from "../../auth";
import {
  BOTON_ROJO_SLUG,
  botonRojoHomePath,
  isBotonRojoOperator,
} from "../../botonRojoAccess";

export function ProjectLayout() {
  const { projectId } = useParams();
  const { token, user, loading, logout } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [operatorHome, setOperatorHome] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !projectId) return;
    fetchProject(token, Number(projectId))
      .then(setProject)
      .catch((err) => setError(err instanceof Error ? err.message : "Proyecto no encontrado"));
  }, [token, projectId]);

  useEffect(() => {
    if (!token || !isBotonRojoOperator(user)) return;
    fetchProjects(token)
      .then((list) => setOperatorHome(botonRojoHomePath(list)))
      .catch(() => setOperatorHome(null));
  }, [token, user]);

  if (loading) {
    return (
      <div className="login-page">
        <p>Cargando panel...</p>
      </div>
    );
  }
  if (!token) return <Navigate to="/admin/login" replace />;

  const base = `/admin/projects/${projectId}`;
  const isBotonRojo = project?.slug === "boton-rojo";
  const operatorOnly = isBotonRojoOperator(user);

  if (operatorOnly && project && project.slug !== BOTON_ROJO_SLUG && operatorHome) {
    return <Navigate to={operatorHome} replace />;
  }

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
          {isBotonRojo ? (
            <>
              <NavLink to={`${base}/antecedentes`}>Antecedentes</NavLink>
              <NavLink to={`${base}/red-comunitaria`}>Red Comunitaria</NavLink>
              <NavLink to={`${base}/equipo-alerta`}>Equipo de alerta</NavLink>
              <NavLink to={`${base}/gateway`}>Celular / Gateway</NavLink>
              <NavLink to={`${base}/logs`}>Logs</NavLink>
            </>
          ) : (
            <>
              <NavLink to={base} end>
                Dashboard
              </NavLink>
              <NavLink to={`${base}/messages`}>Mensajes</NavLink>
              <NavLink to={`${base}/devices`}>Dispositivos</NavLink>
              <NavLink to={`${base}/contacts`}>Contactos</NavLink>
              <NavLink to={`${base}/logs`}>Logs</NavLink>
            </>
          )}
          {!operatorOnly ? <NavLink to="/admin">← Proyectos</NavLink> : null}
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
        {error ? (
          <p className="error">{error}</p>
        ) : !project ? (
          <p className="muted">Cargando proyecto...</p>
        ) : (
          <Outlet context={{ project }} />
        )}
      </main>
    </div>
  );
}
