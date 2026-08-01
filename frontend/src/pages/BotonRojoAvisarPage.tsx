import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { avisarEquipoBotonRojo, fetchBotonRojoAvisarInfo } from "../api";

export function BotonRojoAvisarPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<{
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
        setError(
          msg.includes("Failed to fetch") || msg.includes("NetworkError")
            ? "No hay conexión con el servidor. Misma Wi‑Fi que la PC y Vite/API encendidos."
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
      setError(
        msg.includes("Failed to fetch") || msg.includes("NetworkError")
          ? "No hay conexión con el servidor. Revisá que la PC esté en la misma Wi‑Fi y el front corriendo."
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
