import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchBotonRojoAntecedentes,
  type BotonRojoAntecedente,
  type BotonRojoAntecedenteMessage,
} from "../../api";
import { useAuth } from "../../auth";
import { formatDateTimeAR } from "../../datetime";

function deliveryLabel(status: string) {
  switch (status) {
    case "sent":
    case "delivered":
      return "Entregado / encolado al celular gateway";
    case "failed":
      return "Falló el envío";
    case "pending":
    case "queued":
      return "En cola";
    default:
      return status;
  }
}

function MessageCard({ msg }: { msg: BotonRojoAntecedenteMessage }) {
  const isEquipo = msg.category === "boton-rojo-equipo";
  const who = msg.to_name || (isEquipo ? "Miembro del equipo" : "Red Comunitaria");
  const institution = msg.to_institution ? ` · ${msg.to_institution}` : "";

  return (
    <div className={`br-antecedente-msg ${isEquipo ? "br-msg-equipo" : "br-msg-persona"}`}>
      <div className="br-antecedente-msg-head">
        <strong>
          {isEquipo ? "SMS al equipo" : "SMS a Red Comunitaria"} → {who}
          {institution}
        </strong>
        <span className={`badge badge-${msg.status}`}>{msg.status}</span>
      </div>
      <p className="br-msg-meta">
        Celular: {msg.to_phone} · {deliveryLabel(msg.status)} · {formatDateTimeAR(msg.created_at)}
      </p>
      <div className="br-msg-texto">
        <span className="br-msg-texto-label">Texto que llegó:</span>
        <blockquote>“{msg.content}”</blockquote>
      </div>
      {msg.error_detail ? <p className="error">{msg.error_detail}</p> : null}
    </div>
  );
}

function EnvioRow({
  label,
  done,
  detail,
}: {
  label: string;
  done: boolean;
  detail: string;
}) {
  return (
    <div className={`br-envio-row ${done ? "br-envio-si" : "br-envio-no"}`}>
      <strong>
        {label}: {done ? "SÍ" : "NO"}
      </strong>
      <span>{detail}</span>
    </div>
  );
}

export function BotonRojoAntecedentesPage() {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [items, setItems] = useState<BotonRojoAntecedente[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function reload() {
    if (!token || !projectId) return;
    setLoading(true);
    setError("");
    try {
      setItems(await fetchBotonRojoAntecedentes(token, Number(projectId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar antecedentes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [token, projectId]);

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>Antecedentes</h1>
          <p className="muted">
            Quién recibió el SMS, si se pudo enviar, y el texto exacto que se mandó
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => void reload()} disabled={loading}>
          Actualizar
        </button>
      </div>

      {error ? <p className="error admin-feedback">{error}</p> : null}
      {loading ? <p className="muted">Cargando antecedentes...</p> : null}

      {!loading && !items.length ? (
        <div className="panel">
          <p className="muted">Todavía no llegó ninguna alerta del formulario.</p>
        </div>
      ) : null}

      <div className="br-antecedentes-list">
        {items.map((alert) => {
          const personaMsgs = alert.messages.filter((m) => m.category === "boton-rojo-persona-a");
          const equipoMsgs = alert.messages.filter((m) => m.category === "boton-rojo-equipo");
          const equipoNombres = equipoMsgs
            .map((m) => m.to_name || m.to_phone)
            .filter(Boolean)
            .join(", ");
          const personaDetail = alert.persona_a_enviada
            ? `Avisada ${formatDateTimeAR(alert.notified_at)}${
                personaMsgs[0] ? ` · SMS ${personaMsgs[0].status}` : ""
              }`
            : "Todavía no se envió SMS a Red Comunitaria";
          const equipoDetail = alert.equipo_enviado
            ? `Avisado ${formatDateTimeAR(alert.team_alerted_at)} · ${equipoNombres || "equipo"} · ${
                alert.equipo_sms_enviados
              } ok` + (alert.equipo_sms_fallidos ? `, ${alert.equipo_sms_fallidos} fallidos` : "")
            : "No se tocó “Avisar equipo” o el envío no llegó al backend";

          return (
            <div className="panel br-antecedente" key={alert.id}>
              <div className="br-antecedente-head">
                <div>
                  <h2>
                    Alerta #{alert.id}
                    {alert.requester_name ? ` · ${alert.requester_name}` : ""}
                  </h2>
                  <p className="muted">
                    Celular: {alert.requester_phone} · {formatDateTimeAR(alert.created_at)}
                  </p>
                </div>
              </div>

              <div className="br-envio-block">
                <EnvioRow
                  label="Envío a Red Comunitaria"
                  done={alert.persona_a_enviada}
                  detail={personaDetail}
                />
                <EnvioRow label="Envío al equipo" done={alert.equipo_enviado} detail={equipoDetail} />
              </div>

              {alert.messages.length ? (
                <div className="br-antecedente-msgs">
                  <h3 className="br-antecedente-msgs-title">Detalle de mensajes</h3>
                  {personaMsgs.map((msg) => (
                    <MessageCard key={msg.id} msg={msg} />
                  ))}
                  {equipoMsgs.length ? (
                    equipoMsgs.map((msg) => <MessageCard key={msg.id} msg={msg} />)
                  ) : (
                    <p className="muted br-sin-equipo">Sin mensajes al Equipo de alerta en esta alerta.</p>
                  )}
                </div>
              ) : (
                <p className="muted">Alerta registrada, sin SMS asociados todavía.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
