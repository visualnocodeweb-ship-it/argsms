import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  connectGateway,
  fetchContacts,
  fetchGatewayConfig,
  fetchLogs,
  fetchMessageStatus,
  fetchMessages,
  fetchStats,
  saveGatewayConfig,
  sendBulk,
  sendMessage,
  type Contact,
  type DashboardStats,
  type GatewayConfig,
  type Message,
  type SystemLog,
} from "../../api";
import { useAuth } from "../../auth";
import { formatDateTimeAR } from "../../datetime";

const PAGE_SIZE = 10;

type DestMode = "manual" | "contact" | "list";

export function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [fromPhone, setFromPhone] = useState("");
  const [toPhone, setToPhone] = useState("");
  const [destMode, setDestMode] = useState<DestMode>("manual");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [connectInfo, setConnectInfo] = useState("");
  const [sendStatus, setSendStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<"envios" | "logs">("envios");
  const [messagesPage, setMessagesPage] = useState(0);
  const [logsPage, setLogsPage] = useState(0);

  async function reload() {
    if (!token) return;
    const [s, cfg, lg, msgs, cts] = await Promise.all([
      fetchStats(token),
      fetchGatewayConfig(token),
      fetchLogs(token),
      fetchMessages(token),
      fetchContacts(token),
    ]);
    setStats(s);
    setConfig(cfg);
    setFromPhone(cfg.from_phone || "");
    setLogs(lg);
    setRecentMessages(msgs);
    setContacts(cts);
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"));
  }, [token]);

  const messagePages = Math.max(1, Math.ceil(recentMessages.length / PAGE_SIZE));
  const logPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));

  const pagedMessages = useMemo(() => {
    const page = Math.min(messagesPage, messagePages - 1);
    const start = page * PAGE_SIZE;
    return recentMessages.slice(start, start + PAGE_SIZE);
  }, [recentMessages, messagesPage, messagePages]);

  const pagedLogs = useMemo(() => {
    const page = Math.min(logsPage, logPages - 1);
    const start = page * PAGE_SIZE;
    return logs.slice(start, start + PAGE_SIZE);
  }, [logs, logsPage, logPages]);

  useEffect(() => {
    if (messagesPage > messagePages - 1) setMessagesPage(Math.max(0, messagePages - 1));
  }, [messagePages, messagesPage]);

  useEffect(() => {
    if (logsPage > logPages - 1) setLogsPage(Math.max(0, logPages - 1));
  }, [logPages, logsPage]);

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
    setConnectInfo("");
    try {
      const result = await connectGateway(token);
      if (!result.ok) {
        setError(result.detail || "No se pudo conectar");
      } else {
        setConnectInfo(
          result.mode === "live"
            ? `Conectado · sync ${result.phones_synced} · origen ${result.from_phone || "-"}`
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

  const contactLists = useMemo(() => {
    return Array.from(
      new Set(contacts.map((c) => c.group_name).filter((g): g is string => Boolean(g && g.trim()))),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [contacts]);

  const listRecipients = useMemo(() => {
    if (!selectedList) return [];
    return contacts.filter((c) => c.group_name === selectedList);
  }, [contacts, selectedList]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setSendStatus(null);
    try {
      if (destMode === "list") {
        const phones = listRecipients.map((c) => c.phone);
        if (!phones.length) {
          setSendStatus({ ok: false, text: "Mensaje no enviado" });
          setError("La lista no tiene contactos");
          return;
        }
        const msgs = await sendBulk(token, {
          phones,
          content,
          category: "lista",
        });
        const sent = msgs.filter((m) => m.status !== "failed").length;
        const failed = msgs.length - sent;
        setSendStatus({
          ok: sent > 0,
          text:
            failed === 0
              ? `Mensaje enviado · ${sent} contactos`
              : sent > 0
                ? `Parcial · ${sent} ok, ${failed} no`
                : "Mensaje no enviado",
        });
        if (sent > 0) setContent("");
      } else {
        let destination = toPhone.trim();
        if (destMode === "contact") {
          const contact = contacts.find((c) => String(c.id) === selectedContactId);
          destination = contact?.phone || "";
        }
        if (!destination) {
          setSendStatus({ ok: false, text: "Mensaje no enviado" });
          setError("Elegí un destino");
          return;
        }
        const msg = await sendMessage(token, {
          to_phone: destination,
          content,
          category: "prueba",
        });
        const failed = msg.status === "failed";
        setSendStatus({
          ok: !failed,
          text: failed ? "Mensaje no enviado" : "Mensaje enviado",
        });
        if (!failed) setContent("");
      }
      setError("");
      setMessagesPage(0);
      await reload();
    } catch {
      setSendStatus({ ok: false, text: "Mensaje no enviado" });
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

      {error ? <p className="error admin-feedback">{error}</p> : null}
      {info ? <p className="ok-msg admin-feedback">{info}</p> : null}

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
              ? ` · última sync ${formatDateTimeAR(config.last_sync_at)}`
              : ""}
          </p>
          <div className="connect-actions">
            <button className="btn btn-dark" type="submit" disabled={busy}>
              Guardar config
            </button>
            <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void onConnect()}>
              Conectar / sincronizar celular
            </button>
            {connectInfo ? <span className="connect-status">{connectInfo}</span> : null}
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>3. Preparar mensaje y enviar</h2>
        <form className="form-grid" onSubmit={onSend}>
          <div className="dest-mode-tabs" role="tablist">
            <button
              type="button"
              className={destMode === "manual" ? "history-tab active" : "history-tab"}
              onClick={() => setDestMode("manual")}
            >
              Número
            </button>
            <button
              type="button"
              className={destMode === "contact" ? "history-tab active" : "history-tab"}
              onClick={() => setDestMode("contact")}
            >
              Contacto
            </button>
            <button
              type="button"
              className={destMode === "list" ? "history-tab active" : "history-tab"}
              onClick={() => setDestMode("list")}
            >
              Lista
            </button>
          </div>

          <div className="form-row">
            {destMode === "manual" ? (
              <label>
                Destino (to)
                <input
                  value={toPhone}
                  onChange={(e) => setToPhone(e.target.value)}
                  placeholder="+54911..."
                  required
                />
              </label>
            ) : null}

            {destMode === "contact" ? (
              <label>
                Contacto
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  required
                >
                  <option value="">Elegí un contacto...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name === c.phone ? c.phone : `${c.name} · ${c.phone}`}
                      {c.group_name ? ` (${c.group_name})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {destMode === "list" ? (
              <label>
                Lista
                <select
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  required
                >
                  <option value="">Elegí una lista...</option>
                  {contactLists.map((list) => {
                    const count = contacts.filter((c) => c.group_name === list).length;
                    return (
                      <option key={list} value={list}>
                        {list} ({count})
                      </option>
                    );
                  })}
                </select>
              </label>
            ) : null}

            <label>
              Desde (from)
              <input value={fromPhone || config?.from_phone || ""} disabled />
            </label>
          </div>

          {destMode === "list" && selectedList ? (
            <p className="muted" style={{ margin: 0 }}>
              Se enviará a <strong>{listRecipients.length}</strong> contacto
              {listRecipients.length === 1 ? "" : "s"} de la lista{" "}
              <strong>{selectedList}</strong>.
            </p>
          ) : null}

          {!contacts.length && destMode !== "manual" ? (
            <p className="muted" style={{ margin: 0 }}>
              No hay contactos todavía. Cargalos en{" "}
              <Link to="contacts">Contactos</Link>.
            </p>
          ) : null}

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
          <div className="connect-actions">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {destMode === "list" ? "Enviar a la lista" : "Enviar SMS de prueba"}
            </button>
            {sendStatus ? (
              <span className={sendStatus.ok ? "send-status ok" : "send-status fail"}>
                {sendStatus.text}
              </span>
            ) : null}
          </div>
        </form>
        <p className="muted" style={{ marginTop: "0.8rem", marginBottom: 0 }}>
          Si queda en <strong>pending/queued</strong>, el celular no está recibiendo la orden
          (app httpSMS cerrada, sin datos, o notificaciones bloqueadas).
        </p>
      </div>

      <div className="panel history-panel">
        <div className="history-header">
          <h2>4. Historial</h2>
          <button
            className="btn btn-dark"
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            aria-expanded={historyOpen}
          >
            {historyOpen ? "Contraer" : "Expandir"}
          </button>
        </div>

        {!historyOpen ? (
          <p className="muted history-collapsed-hint">
            Mensajes enviados y logs ocultos. Tocá Expandir para verlos.
          </p>
        ) : (
          <>
            <div className="history-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                className={historyTab === "envios" ? "history-tab active" : "history-tab"}
                aria-selected={historyTab === "envios"}
                onClick={() => setHistoryTab("envios")}
              >
                Mensajes enviados ({recentMessages.length})
              </button>
              <button
                type="button"
                role="tab"
                className={historyTab === "logs" ? "history-tab active" : "history-tab"}
                aria-selected={historyTab === "logs"}
                onClick={() => setHistoryTab("logs")}
              >
                Logs recientes ({logs.length})
              </button>
            </div>

            {historyTab === "envios" ? (
              <div>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Destino</th>
                        <th>Mensaje</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedMessages.map((m) => (
                        <tr key={m.id}>
                          <td>{m.to_phone}</td>
                          <td className="history-msg-content">{m.content}</td>
                          <td>
                            <span className={`badge badge-${m.status}`}>{m.status}</span>
                          </td>
                          <td className="muted">{formatDateTimeAR(m.created_at)}</td>
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
                      {!recentMessages.length ? (
                        <tr>
                          <td colSpan={5} className="muted">
                            Todavía no hay mensajes enviados.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={Math.min(messagesPage, messagePages - 1)}
                  totalPages={messagePages}
                  totalItems={recentMessages.length}
                  onChange={setMessagesPage}
                />
              </div>
            ) : (
              <div>
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
                      {pagedLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <span className={`badge badge-log-${log.level}`}>{log.level}</span>
                          </td>
                          <td>{log.source}</td>
                          <td>{log.message}</td>
                          <td className="muted">{log.detail || "—"}</td>
                          <td>{formatDateTimeAR(log.created_at)}</td>
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
                <Pagination
                  page={Math.min(logsPage, logPages - 1)}
                  totalPages={logPages}
                  totalItems={logs.length}
                  onChange={setLogsPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalItems,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onChange: (page: number) => void;
}) {
  if (!totalItems) return null;
  const from = page * PAGE_SIZE + 1;
  const to = Math.min(totalItems, (page + 1) * PAGE_SIZE);
  return (
    <div className="pager">
      <span className="muted">
        {from}–{to} de {totalItems}
      </span>
      <div className="pager-actions">
        <button
          className="btn btn-dark"
          type="button"
          disabled={page <= 0}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </button>
        <span className="pager-page">
          {page + 1} / {totalPages}
        </span>
        <button
          className="btn btn-dark"
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
