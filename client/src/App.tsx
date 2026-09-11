import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { LoginPage } from './pages/LoginPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { PMDashboardPage } from './pages/PMDashboardPage.js';
import { DeveloperDashboardPage } from './pages/DeveloperDashboardPage.js';
import { TasksPage } from './pages/TasksPage.js';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-cyan-400" />
          <span className="text-xs font-semibold text-slate-400 tracking-wider">
            Loading Velozity Portal...
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
        return <Navigate to="/login" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={renderDashboardByRole()} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Velozity Global Solutions Technical Assessment • Real-Time Client Dashboard with RBAC
      </footer>
    </div>
  );
};

export default App;
