import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AssessmentPage from './pages/AssessmentPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminQuestionsPage from './pages/AdminQuestionsPage';
import AdminAssessmentsPage from './pages/AdminAssessmentsPage';
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
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/assessment'} replace />;
}
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/assessment" element={<RequireAuth><AssessmentPage /></RequireAuth>} />
      <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
      <Route path="/admin/questions" element={<RequireAdmin><AdminQuestionsPage /></RequireAdmin>} />
      <Route path="/admin/assessments" element={<RequireAdmin><AdminAssessmentsPage /></RequireAdmin>} />
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
