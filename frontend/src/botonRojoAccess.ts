import type { Project, User } from "./api";

export const BOTON_ROJO_OPERATOR = "botonrojo@mensajesarg.com";
export const BOTON_ROJO_SLUG = "boton-rojo";

export function isBotonRojoOperator(user: User | null | undefined): boolean {
  const email = (user?.email || "").toLowerCase();
  return email === BOTON_ROJO_OPERATOR || email === "botonrojo";
}

export function botonRojoHomePath(projects: Project[]): string | null {
  const project = projects.find((p) => p.slug === BOTON_ROJO_SLUG);
  return project ? `/admin/projects/${project.id}/antecedentes` : null;
}
