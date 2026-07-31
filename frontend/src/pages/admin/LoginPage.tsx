import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";

const DEMO_EMAIL = "demo@mensajesarg.com";
const DEMO_PASSWORD = "demo123";

export function LoginPage() {
  const { login, token, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && token) return <Navigate to="/admin" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/admin");
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
        <p>Elegí un proyecto para operar el envío de mensajes.</p>
        <div className="demo-creds" style={{
          marginBottom: "1rem",
          padding: "0.85rem 1rem",
          borderRadius: "12px",
          border: "1px solid rgba(25, 201, 138, 0.28)",
          background: "rgba(25, 201, 138, 0.08)",
          fontSize: "0.9rem",
        }}>
          <strong style={{ display: "block", marginBottom: "0.35rem", color: "#19c98a" }}>
            Usuario demo
          </strong>
          <div>Email: <code>{DEMO_EMAIL}</code></div>
          <div>Contraseña: <code>{DEMO_PASSWORD}</code></div>
        </div>
        <div className="form-grid">
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Contraseña
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
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
