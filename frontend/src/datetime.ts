const AR_TZ = "America/Argentina/Buenos_Aires";

/** Parsea ISO del API (UTC) y lo muestra en horario Argentina. */
export function formatDateTimeAR(value: string | null | undefined): string {
  if (!value) return "—";
  const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const iso = hasOffset ? value : `${value}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-AR", { timeZone: AR_TZ });
}
