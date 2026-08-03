import { Navigate, Route, Routes, useOutletContext } from "react-router-dom";
import { AuthProvider } from "./auth";
import type { Project } from "./api";
import { BotonRojoAvisarPage } from "./pages/BotonRojoAvisarPage";
import { LandingPage } from "./pages/LandingPage";
import { BotonRojoAntecedentesPage } from "./pages/admin/BotonRojoAntecedentesPage";
import { BotonRojoEquipoPage } from "./pages/admin/BotonRojoEquipoPage";
import { BotonRojoGatewayPage } from "./pages/admin/BotonRojoGatewayPage";
import { BotonRojoPersonaAPage } from "./pages/admin/BotonRojoPersonaAPage";
import { ContactsPage } from "./pages/admin/ContactsPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { DevicesPage } from "./pages/admin/DevicesPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { LogsPage } from "./pages/admin/LogsPage";
import { MessagesPage } from "./pages/admin/MessagesPage";
import { ProjectLayout } from "./pages/admin/ProjectLayout";
import { ProjectsPage } from "./pages/admin/ProjectsPage";

function ProjectIndex() {
  const { project } = useOutletContext<{ project: Project | null }>();
  if (project?.slug === "boton-rojo") {
    return <Navigate to="antecedentes" replace />;
  }
  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/boton-rojo/avisar/:token" element={<BotonRojoAvisarPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<ProjectsPage />} />
        <Route path="/admin/projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<ProjectIndex />} />
          <Route path="antecedentes" element={<BotonRojoAntecedentesPage />} />
          <Route path="red-comunitaria" element={<BotonRojoPersonaAPage />} />
          <Route path="persona-a" element={<Navigate to="../red-comunitaria" replace />} />
          <Route path="equipo-alerta" element={<BotonRojoEquipoPage />} />
          <Route path="gateway" element={<BotonRojoGatewayPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="logs" element={<LogsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
