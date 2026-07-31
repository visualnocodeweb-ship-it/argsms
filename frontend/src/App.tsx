import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { LandingPage } from "./pages/LandingPage";
import { ContactsPage } from "./pages/admin/ContactsPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { DevicesPage } from "./pages/admin/DevicesPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { LogsPage } from "./pages/admin/LogsPage";
import { MessagesPage } from "./pages/admin/MessagesPage";
import { ProjectLayout } from "./pages/admin/ProjectLayout";
import { ProjectsPage } from "./pages/admin/ProjectsPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<ProjectsPage />} />
        <Route path="/admin/projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<DashboardPage />} />
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
