import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  connectGateway,
  fetchGatewayConfig,
  fetchLogs,
  fetchMessageStatus,
  fetchMessages,
  fetchStats,
  saveGatewayConfig,
  sendMessage,
  type DashboardStats,
  type GatewayConfig,
  type Message,
  type SystemLog,
} from "../../api";
import { useAuth } from "../../auth";

export function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [fromPhone, setFromPhone] = useState("");
  const [toPhone, setToPhone] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    if (!token) return;
    const [s, cfg, lg, msgs] = await Promise.all([
      fetchStats(token),
      fetchGatewayConfig(token),
      fetchLogs(token),
      fetchMessages(token),
    ]);
    setStats(s);
    setConfig(cfg);
    setFromPhone(cfg.from_phone || "");
    setLogs(lg);
    setRecentMessages(msgs.slice(0, 8));
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"));
  }, [token]);

  async function onSaveConfig(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const cfg = await saveGatewayConfig(token, {
        api_key: apiKey || undefined,
        from_phone: fromPhone,
      });
      setConfig(cfg);
      setApiKey("");
      setInfo("Configuración guardada. Ahora podés conectar el celular.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function onConnect() {
    if (!token) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const result = await connectGateway(token);
      if (!result.ok) {
        setError(result.detail || "No se pudo conectar");
      } else {
        setInfo(
          result.mode === "live"
            ? `Conectado. Teléfonos sincronizados: ${result.phones_synced}. Origen: ${result.from_phone || "-"}`
            : "Modo simulación: guardá tu API key de httpSMS para conectar el celular real.",
        );
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const msg = await sendMessage(token, {
        to_phone: toPhone,
        content,
        category: "prueba",
      });
      setInfo(`Mensaje ${msg.status}. ID ${msg.id}${msg.error_detail ? ` · ${msg.error_detail}` : ""}`);
      setContent("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setBusy(false);
    }
  }

  async function onCheckStatus(externalId: string) {
    if (!token) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const result = await fetchMessageStatus(token, externalId);
      if (!result.ok) {
        setError(result.detail || "No se pudo consultar el estado");
      } else {
        setInfo(`Estado en httpSMS: ${result.status}`);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al consultar estado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>Dashboard · Conectar celular</h1>
          <p className="muted">API httpSMS + webhook + envío de prueba + logs</p>
        </div>
        <Link className="btn btn-dark" to="logs">
          Ver logs
        </Link>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="ok-msg">{info}</p> : null}

      {stats ? (
        <div className="stats">
          <div className="stat">
            <span>Mensajes</span>
            <strong>{stats.total_messages}</strong>
          </div>
          <div className="stat">
            <span>Enviados</span>
            <strong>{stats.sent}</strong>
          </div>
          <div className="stat">
            <span>Fallidos</span>
            <strong>{stats.failed}</strong>
          </div>
          <div className="stat">
            <span>Gateways</span>
            <strong>
              {stats.devices_online}/{stats.devices_total}
            </strong>
          </div>
        </div>
      ) : null}

      <div className="panel flow-panel">
        <h2>1. Cómo funciona (HTTP · API · Webhook)</h2>
        <div className="flow-steps">
          <div>
            <strong>1. App Android</strong>
            <p>Instalá httpSMS en tu celular, iniciá sesión y dejá el servicio activo con tu SIM.</p>
          </div>
          <div>
            <strong>2. API Key</strong>
            <p>
              En httpsms.com/settings copiá tu <code>x-api-key</code>. Mensajes ARG la usa para
              hablar con la API.
            </p>
          </div>
          <div>
            <strong>3. HTTP send</strong>
            <p>
              <code>POST /v1/messages/send</code> con <code>from</code>, <code>to</code> y{" "}
              <code>content</code>. El celular dispara el SMS real.
            </p>
          </div>
          <div>
            <strong>4. Webhook</strong>
            <p>
              httpSMS nos avisa sent/delivered/failed en{" "}
              <code>{config?.webhook_url || "/api/webhooks/httpsms"}</code>.
            </p>
          </div>
        </div>
        {config ? (
          <div className="code-box">
            <div>Auth header: <code>{config.docs.auth_header}: YOUR_API_KEY</code></div>
            <div>Send: <code>{config.docs.send}</code></div>
            <div>Phones: <code>{config.docs.phones}</code></div>
            <div>
              Body ejemplo:{" "}
              <code>{`{"from":"${config.from_phone || "+54911..."}","to":"+54911...","content":"Hola"}`}</code>
            </div>
          </div>
        ) : null}
      </div>

      <div className="panel">
        <h2>2. Conectar mi celular</h2>
        <form className="form-grid" onSubmit={onSaveConfig}>
          <div className="form-row">
            <label>
              API Key de httpSMS
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={config?.api_key_set ? `Guardada: ${config.api_key_preview}` : "pegá tu x-api-key"}
              />
            </label>
            <label>
              Número de tu SIM (from) — formato +549...
              <input
                value={fromPhone}
                onChange={(e) => setFromPhone(e.target.value)}
                placeholder="+5492972404186"
                required
              />
            </label>
          </div>
          <p className="muted">
            Estado:{" "}
            <strong>
              {config?.connected ? "conectado" : "no conectado"} · modo {config?.mode || "..."}
            </strong>
            {config?.last_sync_at
              ? ` · última sync ${new Date(config.last_sync_at).toLocaleString("es-AR")}`
              : ""}
          </p>
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <button className="btn btn-dark" type="submit" disabled={busy}>
              Guardar config
            </button>
            <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void onConnect()}>
              Conectar / sincronizar celular
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>3. Preparar mensaje y enviar</h2>
        <form className="form-grid" onSubmit={onSend}>
          <div className="form-row">
            <label>
              Destino (to)
              <input
                value={toPhone}
                onChange={(e) => setToPhone(e.target.value)}
                placeholder="+54911..."
                required
              />
            </label>
            <label>
              Desde (from)
              <input value={fromPhone || config?.from_phone || ""} disabled />
            </label>
          </div>
          <label>
            Contenido del SMS
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hola, prueba Mensajes ARG desde mi celular"
              required
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Enviar SMS de prueba
          </button>
        </form>

        <div style={{ marginTop: "1.2rem" }}>
          <h3 style={{ margin: "0 0 0.7rem", fontSize: "1rem" }}>Últimos envíos</h3>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Destino</th>
                  <th>Estado local</th>
                  <th>External ID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentMessages.map((m) => (
                  <tr key={m.id}>
                    <td>{m.to_phone}</td>
                    <td>
                      <span className={`badge badge-${m.status}`}>{m.status}</span>
                    </td>
                    <td className="muted">{m.external_id || "—"}</td>
                    <td>
                      {m.external_id && !m.external_id.startsWith("sim-") ? (
                        <button
                          className="btn btn-dark"
                          type="button"
                          disabled={busy}
                          onClick={() => void onCheckStatus(m.external_id!)}
                        >
                          Ver estado httpSMS
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: "0.8rem" }}>
            Si queda en <strong>pending/queued</strong>, el celular no está recibiendo la orden
            (app httpSMS cerrada, sin datos, o notificaciones bloqueadas).
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>4. Logs recientes</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Nivel</th>
                <th>Fuente</th>
                <th>Mensaje</th>
                <th>Detalle</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 12).map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className={`badge badge-log-${log.level}`}>{log.level}</span>
                  </td>
                  <td>{log.source}</td>
                  <td>{log.message}</td>
                  <td className="muted">{log.detail || "—"}</td>
                  <td>{new Date(log.created_at).toLocaleString("es-AR")}</td>
                </tr>
              ))}
              {!logs.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Todavía no hay logs. Conectá el celular o enviá un SMS.
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
