import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AssessmentPage from './pages/AssessmentPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminQuestionsPage from './pages/AdminQuestionsPage';
import AdminAssessmentsPage from './pages/AdminAssessmentsPage';
import AdminMonitoringPage from './pages/AdminMonitoringPage';
import { HomePage } from './pages/Home';
import NotFoundPage from './pages/NotFoundPage';
import { ThemeProvider } from './context/ThemeContext';
import { globalStyles } from "./lib/styles";
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/assessment" replace />;
  return <>{children}</>;
}
function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/home" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin-panel/dashboard' : '/assessment'} replace />;
}
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}
      <Route path="/assessment" element={<RequireAuth><AssessmentPage /></RequireAuth>} />
      <Route path="/admin-panel/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
      <Route path="/admin-panel/questions" element={<RequireAdmin><AdminQuestionsPage /></RequireAdmin>} />
      <Route path="/admin-panel/assessments" element={<RequireAdmin><AdminAssessmentsPage /></RequireAdmin>} />
      <Route path="/admin-panel/monitoring" element={<RequireAdmin><AdminMonitoringPage /></RequireAdmin>} />

      {/* Legacy route redirects */}
      <Route path="/admin/dashboard" element={<Navigate to="/admin-panel/dashboard" replace />} />
      <Route path="/admin/questions" element={<Navigate to="/admin-panel/questions" replace />} />
      <Route path="/admin/assessments" element={<Navigate to="/admin-panel/assessments" replace />} />
      <Route path="/admin/monitoring" element={<Navigate to="/admin-panel/monitoring" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
export default function App() {
  return (
    <>
      <style>{globalStyles}</style>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </>

  );
}
