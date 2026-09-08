import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CertificatesPage from './pages/CertificatesPage';
import CertificateDetailPage from './pages/CertificateDetailPage';
import SecretsPage from './pages/SecretsPage';
import SecretDetailPage from './pages/SecretDetailPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import EnvironmentsPage from './pages/EnvironmentsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdministrationPage from './pages/AdministrationPage';
import GraphPage from './pages/GraphPage';

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="certificates/:id" element={<CertificateDetailPage />} />
        <Route path="secrets" element={<SecretsPage />} />
        <Route path="secrets/:id" element={<SecretDetailPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="environments" element={<EnvironmentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="administration" element={<AdministrationPage />} />
        <Route path="graph/certificate/:id" element={<GraphPage kind="certificate" />} />
        <Route path="graph/secret/:id" element={<GraphPage kind="secret" />} />
        <Route path="graph/application/:id" element={<GraphPage kind="application" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
