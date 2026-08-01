import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addBotonRojoEquipoMember,
  deleteBotonRojoEquipoMember,
  fetchBotonRojoEquipo,
  type EquipoMember,
} from "../../api";
import { useAuth } from "../../auth";

export function BotonRojoEquipoPage() {
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
    setMembers(await fetchBotonRojoEquipo(token, Number(projectId)));
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
      await addBotonRojoEquipoMember(token, Number(projectId), {
        name: name.trim(),
        phone: phone.trim(),
        institution: institution.trim() || undefined,
      });
      setName("");
      setPhone("");
      setInstitution("");
      setInfo("Miembro agregado al Equipo de alerta");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    if (!token || !projectId) return;
    await deleteBotonRojoEquipoMember(token, Number(projectId), id);
    await reload();
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>Equipo de alerta</h1>
          <p className="muted">
            Celulares que reciben el SMS cuando Red Comunitaria toca el link del aviso
          </p>
        </div>
      </div>

      {error ? <p className="error admin-feedback">{error}</p> : null}
      {info ? <p className="ok-msg admin-feedback">{info}</p> : null}

      <div className="panel">
        <h2>Agregar al equipo</h2>
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
              Institución
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Bomberos, Policía, Fauna..."
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
                    Todavía no hay nadie en el Equipo de alerta.
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
