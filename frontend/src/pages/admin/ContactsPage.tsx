import { FormEvent, useEffect, useMemo, useState } from "react";
import { createContact, deleteContact, fetchContacts, type Contact } from "../../api";
import { useAuth } from "../../auth";

const LISTS_KEY = "mensajes-arg-contact-lists";

function loadSavedLists(): string[] {
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function persistLists(lists: string[]) {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

export function ContactsPage() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [newListName, setNewListName] = useState("");
  const [extraLists, setExtraLists] = useState<string[]>(() => loadSavedLists());
  const [filterList, setFilterList] = useState("all");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    if (!token) return;
    setContacts(await fetchContacts(token));
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [token]);

  const lists = useMemo(() => {
    const fromContacts = contacts
      .map((c) => c.group_name)
      .filter((g): g is string => Boolean(g && g.trim()));
    return Array.from(new Set([...extraLists, ...fromContacts])).sort((a, b) =>
      a.localeCompare(b, "es"),
    );
  }, [contacts, extraLists]);

  const visible = useMemo(() => {
    if (filterList === "all") return contacts;
    if (filterList === "none") return contacts.filter((c) => !c.group_name);
    return contacts.filter((c) => c.group_name === filterList);
  }, [contacts, filterList]);

  function onCreateList(e: FormEvent) {
    e.preventDefault();
    const value = newListName.trim();
    if (!value) {
      setError("Escribí un nombre para la lista");
      return;
    }
    if (lists.some((l) => l.toLowerCase() === value.toLowerCase())) {
      setError("Esa lista ya existe");
      return;
    }
    const next = [...extraLists, value];
    setExtraLists(next);
    persistLists(next);
    setSelectedList(value);
    setFilterList(value);
    setNewListName("");
    setError("");
    setInfo(`Lista "${value}" creada. Ahora podés agregarle números.`);
  }

  async function onAddNumber(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await createContact(token, {
        phone: phone.trim(),
        name: name.trim() || undefined,
        group_name: selectedList || undefined,
      });
      setPhone("");
      setName("");
      setInfo(
        name.trim()
          ? `Número guardado como "${name.trim()}"`
          : "Número guardado",
      );
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el número");
    } finally {
      setBusy(false);
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
          <p className="muted">Agregá números, poneles un nombre y organizalos en listas</p>
        </div>
      </div>

      {error ? <p className="error admin-feedback">{error}</p> : null}
      {info ? <p className="ok-msg admin-feedback">{info}</p> : null}

      <div className="panel">
        <h2>Crear lista</h2>
        <form className="contacts-inline-form" onSubmit={onCreateList}>
          <label className="contacts-grow">
            Nombre de la lista
            <input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Barrio Centro, Comercios, Clientes..."
            />
          </label>
          <button className="btn btn-dark contacts-submit" type="submit">
            Crear lista
          </button>
        </form>
        {lists.length ? (
          <div className="contacts-list-chips">
            {lists.map((list) => (
              <button
                key={list}
                type="button"
                className={filterList === list ? "history-tab active" : "history-tab"}
                onClick={() => {
                  setFilterList(list);
                  setSelectedList(list);
                }}
              >
                {list}
              </button>
            ))}
            <button
              type="button"
              className={filterList === "all" ? "history-tab active" : "history-tab"}
              onClick={() => setFilterList("all")}
            >
              Todas
            </button>
          </div>
        ) : (
          <p className="muted" style={{ margin: "0.8rem 0 0" }}>
            Todavía no hay listas. Creá una para agrupar números.
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Agregar números</h2>
        <form className="form-grid" onSubmit={onAddNumber}>
          <div className="contacts-add-row">
            <label>
              Número
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54911..."
                required
              />
            </label>
            <label>
              Guardar con nombre
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Opcional — ej. Juan Pérez"
              />
            </label>
            <label>
              Lista
              <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
                <option value="">Sin lista</option>
                {lists.map((list) => (
                  <option key={list} value={list}>
                    {list}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary contacts-submit" type="submit" disabled={busy}>
              Guardar número
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>
          Números
          {filterList !== "all" && filterList !== "none" ? ` · ${filterList}` : ""}
          <span className="muted" style={{ fontWeight: 500, marginLeft: "0.5rem" }}>
            ({visible.length})
          </span>
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Nombre</th>
                <th>Lista</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id}>
                  <td>{c.phone}</td>
                  <td>{c.name === c.phone ? <span className="muted">Sin nombre</span> : c.name}</td>
                  <td>{c.group_name ?? "—"}</td>
                  <td>
                    <button className="btn btn-danger" type="button" onClick={() => void onDelete(c.id)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {!visible.length ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No hay números acá. Usá Agregar números para cargar uno.
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
