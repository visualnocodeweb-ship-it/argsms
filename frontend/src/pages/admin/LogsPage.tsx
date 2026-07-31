import { useEffect, useState } from "react";
import { clearLogs, fetchLogs, type SystemLog } from "../../api";
import { useAuth } from "../../auth";

export function LogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  async function reload() {
    if (!token) return;
    setLogs(await fetchLogs(token));
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [token]);

  async function onClear() {
    if (!token) return;
    await clearLogs(token);
    await reload();
  }

  const visible = logs.filter((l) => (filter === "all" ? true : l.level === filter));

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>Logs</h1>
          <p className="muted">Errores, webhooks y eventos de envío</p>
        </div>
        <button className="btn btn-danger" type="button" onClick={() => void onClear()}>
          Limpiar logs
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="panel">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          {["all", "error", "warning", "info"].map((f) => (
            <button
              key={f}
              type="button"
              className={`btn ${filter === f ? "btn-primary" : "btn-dark"}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nivel</th>
                <th>Fuente</th>
                <th>Mensaje</th>
                <th>Detalle</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>
                    <span className={`badge badge-log-${log.level}`}>{log.level}</span>
                  </td>
                  <td>{log.source}</td>
                  <td>{log.message}</td>
                  <td className="muted" style={{ maxWidth: 360, wordBreak: "break-word" }}>
                    {log.detail || "—"}
                  </td>
                  <td>{new Date(log.created_at).toLocaleString("es-AR")}</td>
                </tr>
              ))}
              {!visible.length ? (
                <tr>
                  <td colSpan={6} className="muted">
                    Sin logs para este filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
