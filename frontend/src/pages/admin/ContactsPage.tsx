import { FormEvent, useEffect, useState } from "react";
import { createContact, deleteContact, fetchContacts, type Contact } from "../../api";
import { useAuth } from "../../auth";

export function ContactsPage() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    if (!token) return;
    setContacts(await fetchContacts(token));
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [token]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    try {
      await createContact(token, {
        name,
        phone,
        group_name: groupName || undefined,
      });
      setName("");
      setPhone("");
      setGroupName("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    }
  }

  async function onDelete(id: number) {
    if (!token) return;
    await deleteContact(token, id);
    await reload();
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>Contactos</h1>
          <p className="muted">Base para avisos, campañas y recordatorios</p>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="panel">
        <h2>Nuevo contacto</h2>
        <form className="form-grid" onSubmit={onCreate}>
          <div className="form-row">
            <label>
              Nombre
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Teléfono
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
          </div>
          <label>
            Grupo
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Barrio Centro, Comercios, Comunidad..."
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Guardar
          </button>
        </form>
      </div>

      <div className="panel">
        <h2>Listado</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Grupo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.group_name ?? "—"}</td>
                <td>
                  <button className="btn btn-danger" type="button" onClick={() => void onDelete(c.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
