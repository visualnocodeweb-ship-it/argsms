import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { avisarEquipoBotonRojo, fetchBotonRojoAvisarInfo } from "../api";

export function BotonRojoAvisarPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<{
    public_id: string | null;
    requester_phone: string;
    requester_name: string | null;
    already_done: boolean;
  } | null>(null);
  const [result, setResult] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchBotonRojoAvisarInfo(token)
      .then((data) => {
        setInfo({
          public_id: data.public_id,
          requester_phone: data.requester_phone,
          requester_name: data.requester_name,
          already_done: data.already_done,
        });
        if (data.already_done) {
          setResult("El equipo ya fue avisado con este link.");
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Link inválido";
        const network =
          msg.includes("Failed to fetch") ||
          msg.includes("NetworkError") ||
          msg.toLowerCase().includes("load failed");
        setError(
          network
            ? "No se pudo contactar la API. Suele ser el certificado SSL del servidor (hstgr.cloud). Probá desde la misma red o revisá el SSL del VPS."
            : msg,
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function onAvisar() {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const res = await avisarEquipoBotonRojo(token);
      setResult(res.detail || `Equipo avisado. SMS enviados: ${res.sent ?? 0}`);
      setInfo((prev) => (prev ? { ...prev, already_done: true } : prev));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo avisar al equipo";
      const network =
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.toLowerCase().includes("load failed");
      setError(
        network
          ? "No se pudo contactar la API al avisar. Revisá SSL del VPS o conexión de datos/Wi‑Fi."
          : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="boton-rojo-public">
      <div className="boton-rojo-card">
        <p className="boton-rojo-kicker">Botón Rojo</p>
        <h1>Avisar equipo</h1>
        {loading ? <p>Cargando...</p> : null}
        {error ? <p className="error admin-feedback">{error}</p> : null}
        {info && !loading ? (
          <>
            {info.public_id ? (
              <p className="muted">
                ID alerta: <strong>{info.public_id}</strong>
              </p>
            ) : null}
            <p>
              Solicitud de ayuda de{" "}
              <strong>{info.requester_name || info.requester_phone}</strong>
              {info.requester_name ? ` (${info.requester_phone})` : ""}.
            </p>
            {result ? (
              <p className="ok-msg admin-feedback">{result}</p>
            ) : (
              <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void onAvisar()}>
                {busy ? "Enviando..." : "Avisar al Equipo de alerta"}
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
