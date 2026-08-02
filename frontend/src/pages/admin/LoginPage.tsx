import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { fetchProjects } from "../../api";
import { useAuth } from "../../auth";
import { botonRojoHomePath, isBotonRojoOperator } from "../../botonRojoAccess";

export function LoginPage() {
  const { login, token, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && token) return <Navigate to="/admin" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (isBotonRojoOperator(user)) {
        const token = localStorage.getItem("mensajes_arg_token");
        if (!token) {
          navigate("/admin");
          return;
        }
        const projects = await fetchProjects(token);
        navigate(botonRojoHomePath(projects) ?? "/admin");
      } else {
        navigate("/admin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={onSubmit}>
        <div className="brand" style={{ marginBottom: "1rem" }}>
          Mensajes <span>ARG</span>
        </div>
        <h1>Admin</h1>
        <p>Ingresá con tu usuario para operar el envío de mensajes.</p>
        <div className="form-grid">
          <label>
            Usuario
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="text"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Ingresando..." : "Entrar"}
          </button>
          <Link to="/" className="muted" style={{ textAlign: "center" }}>
            Volver al sitio
          </Link>
        </div>
      </form>
    </div>
  );
}
