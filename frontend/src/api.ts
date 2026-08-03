const API_BASE = import.meta.env.VITE_API_URL ?? "";

export type User = {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
};

export type Device = {
  id: number;
  name: string;
  phone_number: string;
  httpsms_id: string | null;
  is_online: boolean;
  notes: string | null;
  created_at: string;
};

export type Contact = {
  id: number;
  name: string;
  phone: string;
  group_name: string | null;
  created_at: string;
};

export type Message = {
  id: number;
  to_phone: string;
  content: string;
  status: string;
  category: string | null;
  device_id: number | null;
  external_id: string | null;
  error_detail: string | null;
  created_at: string;
  sent_at: string | null;
};

export type DashboardStats = {
  total_messages: number;
  sent: number;
  pending: number;
  failed: number;
  devices_online: number;
  devices_total: number;
  contacts_total: number;
};

function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item: { msg?: string } | string) =>
          typeof item === "string" ? item : item.msg || JSON.stringify(item),
        )
        .join("; ");
    }
    if (typeof data.message === "string") return data.message;
    return `Error HTTP ${res.status}`;
  } catch {
    return `Error HTTP ${res.status}`;
  }
}

export async function loginRequest(email: string, password: string): Promise<string> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.access_token as string;
}

export async function fetchMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchStats(token: string): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchSystem(token: string) {
  const res = await fetch(`${API_BASE}/api/admin/system`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchMessages(token: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/api/messages`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function sendMessage(
  token: string,
  payload: { to_phone: string; content: string; category?: string; device_id?: number },
): Promise<Message> {
  const res = await fetch(`${API_BASE}/api/messages`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function sendBulk(
  token: string,
  payload: { phones: string[]; content: string; category?: string },
): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/api/messages/bulk`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchDevices(token: string): Promise<Device[]> {
  const res = await fetch(`${API_BASE}/api/devices`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function createDevice(
  token: string,
  payload: { name: string; phone_number: string; notes?: string; is_online?: boolean },
): Promise<Device> {
  const res = await fetch(`${API_BASE}/api/devices`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function toggleDevice(token: string, id: number): Promise<Device> {
  const res = await fetch(`${API_BASE}/api/devices/${id}/toggle`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchContacts(token: string): Promise<Contact[]> {
  const res = await fetch(`${API_BASE}/api/contacts`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function createContact(
  token: string,
  payload: { name?: string; phone: string; group_name?: string },
): Promise<Contact> {
  const res = await fetch(`${API_BASE}/api/contacts`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function deleteContact(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/contacts/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
}

export type GatewayConfig = {
  api_key_set: boolean;
  api_key_preview: string;
  from_phone: string;
  webhook_secret: string;
  connected: boolean;
  mode: string;
  last_sync_at: string | null;
  notes: string | null;
  webhook_url: string;
  docs: {
    send: string;
    phones: string;
    auth_header: string;
    guide: string;
  };
};

export type SystemLog = {
  id: number;
  level: string;
  source: string;
  message: string;
  detail: string | null;
  created_at: string;
};

export async function fetchGatewayConfig(token: string): Promise<GatewayConfig> {
  const res = await fetch(`${API_BASE}/api/gateway/config`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function saveGatewayConfig(
  token: string,
  payload: { api_key?: string; from_phone: string; webhook_secret?: string; notes?: string },
): Promise<GatewayConfig> {
  const res = await fetch(`${API_BASE}/api/gateway/config`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function connectGateway(token: string) {
  const res = await fetch(`${API_BASE}/api/gateway/connect`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchMessageStatus(token: string, externalId: string) {
  const res = await fetch(`${API_BASE}/api/gateway/message-status/${externalId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchLogs(token: string): Promise<SystemLog[]> {
  const res = await fetch(`${API_BASE}/api/logs`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function clearLogs(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/logs`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
}

export type Project = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
};

export async function fetchProjects(token: string): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/api/projects`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchProject(token: string, projectId: number): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function createProject(
  token: string,
  payload: { name: string; slug: string; description?: string; color?: string },
): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export type BotonRojoPersonaA = {
  persona_a_phone: string;
  project_id: number;
  project_name: string;
  avisar_equipo_hint: string;
};

export type EquipoMember = {
  id: number;
  name: string;
  phone: string;
  institution: string | null;
  created_at: string;
};

export type BotonRojoAntecedenteMessage = {
  id: number;
  to_phone: string;
  to_name: string | null;
  to_institution: string | null;
  content: string;
  status: string;
  category: string | null;
  error_detail: string | null;
  created_at: string;
  sent_at: string | null;
};

export type BotonRojoAntecedente = {
  id: number;
  requester_phone: string;
  requester_name: string | null;
  status: string;
  created_at: string;
  notified_at: string | null;
  team_alerted_at: string | null;
  persona_a_enviada: boolean;
  equipo_enviado: boolean;
  equipo_sms_enviados: number;
  equipo_sms_fallidos: number;
  messages: BotonRojoAntecedenteMessage[];
};

export async function fetchBotonRojoPersonaA(token: string, projectId: number) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/boton-rojo/persona-a`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<BotonRojoPersonaA>;
}

export async function saveBotonRojoPersonaA(token: string, projectId: number, phone: string) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/boton-rojo/persona-a`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ persona_a_phone: phone }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<BotonRojoPersonaA>;
}

export async function fetchBotonRojoRed(token: string, projectId: number) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/boton-rojo/red-comunitaria`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<EquipoMember[]>;
}

export async function addBotonRojoRedMember(
  token: string,
  projectId: number,
  payload: { name: string; phone: string; institution?: string },
) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/boton-rojo/red-comunitaria`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<EquipoMember>;
}

export async function deleteBotonRojoRedMember(token: string, projectId: number, memberId: number) {
  const res = await fetch(
    `${API_BASE}/api/projects/${projectId}/boton-rojo/red-comunitaria/${memberId}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    },
  );
  if (!res.ok) throw new Error(await readError(res));
}

export async function fetchBotonRojoEquipo(token: string, projectId: number) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/boton-rojo/equipo`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<EquipoMember[]>;
}

export async function addBotonRojoEquipoMember(
  token: string,
  projectId: number,
  payload: { name: string; phone: string; institution?: string },
) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/boton-rojo/equipo`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<EquipoMember>;
}

export async function deleteBotonRojoEquipoMember(token: string, projectId: number, memberId: number) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/boton-rojo/equipo/${memberId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
}

export async function fetchBotonRojoAntecedentes(token: string, projectId: number) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/boton-rojo/antecedentes`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<BotonRojoAntecedente[]>;
}

export async function fetchBotonRojoAvisarInfo(token: string) {
  const res = await fetch(`${API_BASE}/api/public/boton-rojo/avisar/${token}`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<{
    ok: boolean;
    status: string;
    requester_phone: string;
    requester_name: string | null;
    already_done: boolean;
  }>;
}

export async function avisarEquipoBotonRojo(token: string) {
  const res = await fetch(`${API_BASE}/api/public/boton-rojo/avisar/${token}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<{
    ok: boolean;
    already_done: boolean;
    detail: string;
    sent: number;
    failed?: number;
  }>;
}

/** Lo usa el otro proyecto (formulario Botón Rojo) */
export async function triggerBotonRojoAlerta(payload: { phone: string; name?: string }) {
  const res = await fetch(`${API_BASE}/api/public/boton-rojo/alerta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<{ ok: boolean; detail: string; alert_id: number | null }>;
}
