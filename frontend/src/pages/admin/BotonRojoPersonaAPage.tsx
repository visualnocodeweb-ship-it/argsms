import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchBotonRojoPersonaA, saveBotonRojoPersonaA } from "../../api";
import { useAuth } from "../../auth";

export function BotonRojoPersonaAPage() {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [phone, setPhone] = useState("");
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token || !projectId) return;
    fetchBotonRojoPersonaA(token, Number(projectId))
      .then((cfg) => {
        setPhone(cfg.persona_a_phone);
        setHint(cfg.avisar_equipo_hint);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [token, projectId]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !projectId) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const cfg = await saveBotonRojoPersonaA(token, Number(projectId), phone);
      setPhone(cfg.persona_a_phone);
      setInfo(`Celular Red Comunitaria guardado: ${cfg.persona_a_phone}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>Celular Red Comunitaria</h1>
          <p className="muted">
            Recibe el SMS cuando el otro proyecto envía un formulario de Botón Rojo
          </p>
        </div>
      </div>

      {error ? <p className="error admin-feedback">{error}</p> : null}
      {info ? <p className="ok-msg admin-feedback">{info}</p> : null}

      <div className="panel">
        <h2>Quién recibe el primer aviso</h2>
        <p className="muted">{hint}</p>
        <form className="form-grid" onSubmit={onSave}>
          <label>
            Celular Red Comunitaria
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="02944249272 o +5492944249272"
              required
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Guardar
          </button>
        </form>
      </div>

      <div className="panel">
        <h2>Cómo funciona</h2>
        <ol className="boton-rojo-steps">
          <li>El otro proyecto completa un formulario con un celular.</li>
          <li>Ese sistema llama a Mensajes ARG (Botón Rojo).</li>
          <li>
            Llega un SMS a <strong>Red Comunitaria</strong> avisando que se activó el Botón Rojo, con
            un link <strong>Avisar equipo</strong>.
          </li>
          <li>Red Comunitaria toca el link y se avisa a todo el Equipo de alerta.</li>
        </ol>
      </div>
    </div>
  );
}
