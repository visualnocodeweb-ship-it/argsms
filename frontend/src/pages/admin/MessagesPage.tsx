import { FormEvent, useEffect, useState } from "react";
import {
  fetchContacts,
  fetchMessages,
  sendBulk,
  sendMessage,
  type Contact,
  type Message,
} from "../../api";
import { useAuth } from "../../auth";
import { formatDateTimeAR } from "../../datetime";

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export function MessagesPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [toPhone, setToPhone] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("alerta");
  const [bulkPhones, setBulkPhones] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    if (!token) return;
    const [msgs, cts] = await Promise.all([fetchMessages(token), fetchContacts(token)]);
    setMessages(msgs);
    setContacts(cts);
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [token]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await sendMessage(token, { to_phone: toPhone, content, category });
      setContent("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setBusy(false);
    }
  }

  async function onBulk(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const phones = bulkPhones
        .split(/[\n,;]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      await sendBulk(token, { phones, content, category });
      setContent("");
      setBulkPhones("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el masivo");
    } finally {
      setBusy(false);
    }
  }

  function fillFromContact(phone: string) {
    setToPhone(phone);
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>Mensajes</h1>
          <p className="muted">Envío individual, masivo e historial interno</p>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="panel">
        <h2>Enviar SMS</h2>
        <form className="form-grid" onSubmit={onSend}>
          <div className="form-row">
            <label>
              Destino
              <input
                value={toPhone}
                onChange={(e) => setToPhone(e.target.value)}
                placeholder="+54911..."
                required
              />
            </label>
            <label>
              Categoría
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="alerta">Emergencia / alerta</option>
                <option value="negocio">Negocio</option>
                <option value="comunidad">Comunidad</option>
              </select>
            </label>
          </div>
          <label>
            Contenido
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="MUNICIPALIDAD: Corte de agua hoy de 14 a 18hs en Barrio Centro"
              required
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Enviar ahora
          </button>
        </form>
      </div>

      <div className="panel">
        <h2>Envío masivo</h2>
        <form className="form-grid" onSubmit={onBulk}>
          <label>
            Teléfonos (uno por línea o separados por coma)
            <textarea
              rows={4}
              value={bulkPhones}
              onChange={(e) => setBulkPhones(e.target.value)}
              placeholder={"+5491100000001\n+5491100000002"}
              required
            />
          </label>
          <p className="muted">Usa el mismo contenido y categoría del formulario de arriba.</p>
          <button className="btn btn-dark" type="submit" disabled={busy || !content}>
            Enviar masivo
          </button>
        </form>
      </div>

      <div className="panel">
        <h2>Contactos rápidos</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {contacts.map((c) => (
            <button
              key={c.id}
              type="button"
              className="btn btn-ghost"
              style={{ color: "var(--text)", borderColor: "rgba(16,36,48,0.12)", background: "#f3f7f9" }}
              onClick={() => fillFromContact(c.phone)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>Historial</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Destino</th>
                <th>Contenido</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.to_phone}</td>
                  <td>
                    {m.content}
                    {m.error_detail ? (
                      <div className="muted" style={{ marginTop: "0.35rem" }}>
                        {m.error_detail}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td>{formatDateTimeAR(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
