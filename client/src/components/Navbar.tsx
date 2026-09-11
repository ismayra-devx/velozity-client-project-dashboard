import React from 'react';
import { LogOut, Users, Shield, Briefcase, Code2, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { NotificationDropdown } from './NotificationDropdown.js';
import { Link, useLocation } from 'react-router-dom';

const DEMO_USERS = [
  { label: 'Admin (Sarah)', email: 'admin@velozity.com', role: 'ADMIN', icon: Shield },
  { label: 'PM 1 (Alex)', email: 'pm1@velozity.com', role: 'PM', icon: Briefcase },
  { label: 'PM 2 (Jordan)', email: 'pm2@velozity.com', role: 'PM', icon: Briefcase },
  { label: 'Dev 1 (Ravi)', email: 'dev1@velozity.com', role: 'DEV', icon: Code2 },
  { label: 'Dev 2 (Elena)', email: 'dev2@velozity.com', role: 'DEV', icon: Code2 },
];

export const Navbar: React.FC = () => {
  const { user, logout, switchUser } = useAuth();
  const { isConnected, activeUserCount } = useSocket();
  const location = useLocation();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  VELOZITY
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  Agency Portal
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  location.pathname === '/' ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-900/60' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/tasks"
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  location.pathname === '/tasks' ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-900/60' : 'text-slate-400 hover:text-white'
                }`}
              >
                Task Explorer & Filters
              </Link>
            </nav>
          </div>

          {/* Quick Demo Switcher for Evaluation */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Role Switcher:
            </span>
            {DEMO_USERS.map((demo) => {
              const isActive = user.email === demo.email;
              const Icon = demo.icon;
              return (
                <button
                  key={demo.email}
                  onClick={() => switchUser(demo.email)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Switch to ${demo.label}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{demo.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-3">
            {/* WebSocket Presence & State */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-rose-400'
                  } opacity-75`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="font-medium text-slate-300 hidden sm:inline">
                {isConnected ? 'WS Live' : 'Connecting'}
              </span>

              {/* Admin Presence live count */}
              {user.role === 'ADMIN' && (
                <div className="flex items-center gap-1 pl-2 ml-1 border-l border-slate-800 text-cyan-400 font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{activeUserCount} online</span>
                </div>
              )}
            </div>

            {/* In-app Notification Dropdown */}
            <NotificationDropdown />

            {/* Profile Info */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                {user.role.replace('_', ' ')}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors border border-slate-800"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
