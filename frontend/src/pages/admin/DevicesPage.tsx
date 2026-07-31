import { FormEvent, useEffect, useState } from "react";
import { createDevice, fetchDevices, toggleDevice, type Device } from "../../api";
import { useAuth } from "../../auth";

export function DevicesPage() {
  const { token } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    if (!token) return;
    setDevices(await fetchDevices(token));
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [token]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    try {
      await createDevice(token, {
        name,
        phone_number: phone,
        notes: notes || undefined,
        is_online: true,
      });
      setName("");
      setPhone("");
      setNotes("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    }
  }

  async function onToggle(id: number) {
    if (!token) return;
    await toggleDevice(token, id);
    await reload();
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>Dispositivos</h1>
          <p className="muted">Androids con httpSMS que actúan como puerta SMS</p>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="panel">
        <h2>Registrar gateway</h2>
        <form className="form-grid" onSubmit={onCreate}>
          <div className="form-row">
            <label>
              Nombre
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Número SIM
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
          </div>
          <label>
            Notas
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <button className="btn btn-primary" type="submit">
            Agregar dispositivo
          </button>
        </form>
      </div>

      <div className="panel">
        <h2>Gateways</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>SIM</th>
              <th>Estado</th>
              <th>Notas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.phone_number}</td>
                <td>
                  <span className={`badge ${d.is_online ? "badge-online" : "badge-offline"}`}>
                    {d.is_online ? "online" : "offline"}
                  </span>
                </td>
                <td>{d.notes ?? "—"}</td>
                <td>
                  <button className="btn btn-dark" type="button" onClick={() => void onToggle(d.id)}>
                    Toggle
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
