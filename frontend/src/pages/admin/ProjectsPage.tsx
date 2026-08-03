import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { createProject, fetchProjects, type Project } from "../../api";
import { useAuth } from "../../auth";
import { botonRojoHomePath, isBotonRojoOperator } from "../../botonRojoAccess";
import { faunaNqnHomePath, isFaunaNqnOperator } from "../../faunaNqnAccess";

export function ProjectsPage() {
  const { token, user, loading, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [homePath, setHomePath] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchProjects(token)
      .then((list) => {
        setProjects(list);
        if (isBotonRojoOperator(user)) {
          setHomePath(botonRojoHomePath(list));
        } else if (isFaunaNqnOperator(user)) {
          setHomePath(faunaNqnHomePath(list));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [token, user]);

  if (loading) {
    return (
      <div className="login-page">
        <p>Cargando proyectos...</p>
      </div>
    );
  }
  if (!token) return <Navigate to="/admin/login" replace />;
  if ((isBotonRojoOperator(user) || isFaunaNqnOperator(user)) && homePath) {
    return <Navigate to={homePath} replace />;
  }

  async function onCreate() {
    if (!token || !name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const slug = name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const project = await createProject(token, {
        name: name.trim(),
        slug: slug || `proyecto-${Date.now()}`,
        description: "Nuevo proyecto Mensajes ARG",
        color: "#4aa3d9",
      });
      setProjects((prev) => [...prev, project]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="projects-page">
      <header className="projects-top">
        <div>
          <div className="brand">
            Mensajes <span>ARG</span>
          </div>
          <p className="muted">Hola {user?.full_name}. Elegí un proyecto para operar.</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={logout}>
          Salir
        </button>
      </header>

      <section className="projects-hero">
        <h1>Proyectos</h1>
        <p>Cada proyecto tiene su dashboard, mensajes, dispositivos, contactos y logs.</p>
      </section>

      {error ? <p className="error" style={{ textAlign: "center" }}>{error}</p> : null}

      <div className="projects-grid">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/admin/projects/${project.id}`}
            className="project-orb"
            style={{ ["--project-color" as string]: project.color }}
          >
            <span className="project-orb-ring" />
            <span className="project-orb-core">{project.name}</span>
            <span className="project-orb-sub">{project.slug}</span>
          </Link>
        ))}
      </div>

      <div className="projects-create panel">
        <h2>Agregar proyecto</h2>
        <div className="form-row" style={{ alignItems: "end" }}>
          <label>
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Municipalidad, Tienda, Club..."
            />
          </label>
          <button className="btn btn-primary" type="button" disabled={creating || !name.trim()} onClick={() => void onCreate()}>
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}
