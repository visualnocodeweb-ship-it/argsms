import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addBotonRojoRedMember,
  deleteBotonRojoRedMember,
  fetchBotonRojoRed,
  type EquipoMember,
} from "../../api";
import { useAuth } from "../../auth";

export function BotonRojoPersonaAPage() {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [members, setMembers] = useState<EquipoMember[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    if (!token || !projectId) return;
    setMembers(await fetchBotonRojoRed(token, Number(projectId)));
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [token, projectId]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!token || !projectId) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await addBotonRojoRedMember(token, Number(projectId), {
        name: name.trim(),
        phone: phone.trim(),
        institution: institution.trim() || undefined,
      });
      setName("");
      setPhone("");
      setInstitution("");
      setInfo("Persona agregada a Red Comunitaria");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    if (!token || !projectId) return;
    await deleteBotonRojoRedMember(token, Number(projectId), id);
    await reload();
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>Red Comunitaria</h1>
          <p className="muted">
            Personas que reciben el SMS con el link “Avisar equipo” cuando llega un formulario.
            Podés cargar varias; quedan guardadas en la base.
          </p>
        </div>
      </div>

      {error ? <p className="error admin-feedback">{error}</p> : null}
      {info ? <p className="ok-msg admin-feedback">{info}</p> : null}

      <div className="panel">
        <h2>Agregar a Red Comunitaria</h2>
        <form className="form-grid" onSubmit={onAdd}>
          <div className="contacts-add-row">
            <label>
              Celular
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54911..."
                required
              />
            </label>
            <label>
              Nombre
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y apellido"
                required
              />
            </label>
            <label>
              Institución / barrio
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Opcional"
              />
            </label>
            <button className="btn btn-primary contacts-submit" type="submit" disabled={busy}>
              Agregar
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>
          Integrantes{" "}
          <span className="muted" style={{ fontWeight: 500 }}>
            ({members.length})
          </span>
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Celular</th>
                <th>Nombre</th>
                <th>Institución</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.phone}</td>
                  <td>{m.name}</td>
                  <td>{m.institution || "—"}</td>
                  <td>
                    <button className="btn btn-danger" type="button" onClick={() => void onDelete(m.id)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {!members.length ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Todavía no hay nadie en Red Comunitaria. Agregá al menos una persona.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Cómo funciona</h2>
        <ol className="boton-rojo-steps">
          <li>El otro proyecto completa un formulario con un celular.</li>
          <li>Mensajes ARG envía el mismo SMS (con link) a todas las personas de Red Comunitaria.</li>
          <li>Cualquiera de ellas puede tocar <strong>Avisar equipo</strong>.</li>
          <li>Ahí se avisa a todo el Equipo de alerta.</li>
        </ol>
      </div>
    </div>
  );
}
