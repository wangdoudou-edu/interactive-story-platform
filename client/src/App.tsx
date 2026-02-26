import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import ProjectListPage from './pages/ProjectListPage';
import TeacherDashboard from './pages/TeacherDashboard';
import './index.css';

function AppContent() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <span className="loading-icon">🤖</span>
          <span className="loading-spinner"></span>
          <span>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/projects" replace />
            : <LoginPage onLoginSuccess={() => window.location.href = '/projects'} />
        }
      />
      <Route
        path="/teacher"
        element={
          isAuthenticated && user?.role === 'TEACHER'
            ? <TeacherDashboard />
            : <Navigate to="/" replace />
        }
      />
      <Route
        path="/projects"
        element={
          isAuthenticated
            ? <ProjectListPage />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/chat"
        element={
          isAuthenticated
            ? <ChatPage />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to="/projects" replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
