import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/Sidebar.js';
import { TopHeader } from './components/TopHeader.js';
import { LoginPage } from './pages/LoginPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { PMDashboardPage } from './pages/PMDashboardPage.js';
import { DeveloperDashboardPage } from './pages/DeveloperDashboardPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { TasksPage } from './pages/TasksPage.js';
import { ClientsPage } from './pages/ClientsPage.js';
import { TeamPage } from './pages/TeamPage.js';
import { ActivityFeedPage } from './pages/ActivityFeedPage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { UserManagementPage } from './pages/UserManagementPage.js';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600" />
          <span className="text-xs font-semibold text-slate-500 tracking-wider">
            Loading Velozity Agency Portal...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderDashboardByRole = () => {
    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboardPage />;
      case 'PROJECT_MANAGER':
        return <PMDashboardPage />;
      case 'DEVELOPER':
        return <DeveloperDashboardPage />;
      default:
        return <Navigate to="/" replace />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={renderDashboardByRole()} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route
              path="/clients"
              element={
                user.role === 'ADMIN' ? (
                  <ClientsPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/activity" element={<ActivityFeedPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route
              path="/users"
              element={
                user.role === 'ADMIN' ? (
                  <UserManagementPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
