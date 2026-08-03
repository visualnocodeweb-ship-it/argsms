import type { Project, User } from "./api";

export const FAUNA_NQN_OPERATOR = "faunanqn@mensajesarg.com";
export const FAUNA_NQN_SLUG = "faunanqn";

export function isFaunaNqnOperator(user: User | null | undefined): boolean {
  const email = (user?.email || "").toLowerCase();
  return email === FAUNA_NQN_OPERATOR || email === "faunanqn";
}

export function faunaNqnHomePath(projects: Project[]): string | null {
  const project = projects.find((p) => p.slug === FAUNA_NQN_SLUG);
  return project ? `/admin/projects/${project.id}` : null;
}
