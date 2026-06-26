import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import PageWrapper from './components/layout/PageWrapper';

// Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetCodePage from './pages/auth/ResetCodePage';
import SetNewPasswordPage from './pages/auth/SetNewPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminProjectsPage from './pages/admin/ProjectsPage';

// PM Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerProjectsPage from './pages/manager/ProjectsPage';
import ManagerCalendarPage from './pages/manager/CalendarPage';

// Collaborator Pages
import CollabDashboard from './pages/collaborator/CollabDashboard';
import CollabProjectsPage from './pages/collaborator/MyProjectsPage';
import CollabCalendarPage from './pages/collaborator/CalendarPage';

// Shared Pages
import ProfilePage from './pages/shared/ProfilePage';
import SettingsPage from './pages/shared/SettingsPage';
import NotificationsPage from './pages/shared/NotificationsPage';

function DashboardRouter() {
  const { user } = useAuth();
  const role = user?.role || 'Collaborator';

  if (role === 'Admin') {
    return <AdminDashboard />;
  } else if (role === 'Project Manager') {
    return <ManagerDashboard />;
  } else {
    return <CollabDashboard />;
  }
}

function ProjectsRouter() {
  const { user } = useAuth();
  const role = user?.role || 'Collaborator';

  if (role === 'Admin') {
    return <AdminProjectsPage />;
  } else if (role === 'Project Manager') {
    return <ManagerProjectsPage />;
  } else {
    return <CollabProjectsPage />;
  }
}

function CalendarRouter() {
  const { user } = useAuth();
  const role = user?.role || 'Collaborator';

  if (role === 'Project Manager') {
    return <ManagerCalendarPage />;
  } else if (role === 'Collaborator') {
    return <CollabCalendarPage />;
  } else {
    // Admin doesn't have a calendar listed in sidebar nav, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }
}

function AuthenticatedRoutes() {
  return (
    <PageWrapper>
      <Routes>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/projects" element={<ProjectsRouter />} />
        <Route path="/calendar" element={<CalendarRouter />} />
        <Route path="/users" element={
          <ProtectedRoute roles={['Admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </PageWrapper>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-code" element={<ResetCodePage />} />
          <Route path="/set-new-password" element={<SetNewPasswordPage />} />
          <Route path="/reset-password" element={
            <ProtectedRoute><ResetPasswordPage /></ProtectedRoute>
          } />

          {/* Core App Shell */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AuthenticatedRoutes />
            </ProtectedRoute>
          } />
        </Routes>
        {/* Global Styled Toasts */}
        <ToastContainer position="top-right" autoClose={5000} />
      </BrowserRouter>
    </AuthProvider>
  );
}
