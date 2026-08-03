import { FormEvent, useEffect, useState } from "react";
import {
  connectGateway,
  fetchGatewayConfig,
  saveGatewayConfig,
  type GatewayConfig,
} from "../../api";
import { useAuth } from "../../auth";
import { formatDateTimeAR } from "../../datetime";

export function BotonRojoGatewayPage() {
  const { token } = useAuth();
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [fromPhone, setFromPhone] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [connectInfo, setConnectInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    if (!token) return;
    const cfg = await fetchGatewayConfig(token);
    setConfig(cfg);
    setFromPhone(cfg.from_phone || "");
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"));
  }, [token]);

  async function onSaveConfig(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const cfg = await saveGatewayConfig(token, {
        api_key: apiKey || undefined,
        from_phone: fromPhone,
      });
      setConfig(cfg);
      setApiKey("");
      setInfo("Configuración guardada. Ahora conectá / sincronizá el celular.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function onConnect() {
    if (!token) return;
    setBusy(true);
    setError("");
    setConnectInfo("");
    try {
      const result = await connectGateway(token);
      if (!result.ok) {
        setError(result.detail || "No se pudo conectar");
      } else {
        setConnectInfo(
          result.mode === "live"
            ? `Conectado · sync ${result.phones_synced} · origen ${result.from_phone || "-"}`
            : "Modo simulación: guardá tu API key de httpSMS para conectar el celular real.",
        );
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>Celular / Gateway</h1>
          <p className="muted">
            Sin este paso los SMS de Botón Rojo fallan con “falta número de origen”.
          </p>
        </div>
      </div>

      {error ? <p className="error admin-feedback">{error}</p> : null}
      {info ? <p className="ok-msg admin-feedback">{info}</p> : null}

      <div className="panel flow-panel">
        <h2>Cómo conectar</h2>
        <div className="flow-steps">
          <div>
            <strong>1. App Android</strong>
            <p>Instalá httpSMS, iniciá sesión y dejá el servicio activo con tu SIM.</p>
          </div>
          <div>
            <strong>2. API Key</strong>
            <p>
              En httpsms.com/settings copiá tu <code>x-api-key</code> y pegala abajo.
            </p>
          </div>
          <div>
            <strong>3. Número origen</strong>
            <p>El celular que envía, en formato <code>+549...</code>.</p>
          </div>
          <div>
            <strong>4. Sincronizar</strong>
            <p>Guardá y tocá “Conectar / sincronizar celular”.</p>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Conectar mi celular</h2>
        <form className="form-grid" onSubmit={onSaveConfig}>
          <div className="form-row">
            <label>
              API Key de httpSMS
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  config?.api_key_set ? `Guardada: ${config.api_key_preview}` : "pegá tu x-api-key"
                }
              />
            </label>
            <label>
              Número de tu SIM (from) — formato +549...
              <input
                value={fromPhone}
                onChange={(e) => setFromPhone(e.target.value)}
                placeholder="+5492972404186"
                required
              />
            </label>
          </div>
          <p className="muted">
            Estado:{" "}
            <strong>
              {config?.connected ? "conectado" : "no conectado"} · modo {config?.mode || "..."}
            </strong>
            {config?.last_sync_at
              ? ` · última sync ${formatDateTimeAR(config.last_sync_at)}`
              : ""}
          </p>
          {config?.webhook_url ? (
            <p className="muted">
              Webhook: <code>{config.webhook_url}</code>
            </p>
          ) : null}
          <div className="connect-actions">
            <button className="btn btn-dark" type="submit" disabled={busy}>
              Guardar config
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy}
              onClick={() => void onConnect()}
            >
              Conectar / sincronizar celular
            </button>
            {connectInfo ? <span className="connect-status">{connectInfo}</span> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
