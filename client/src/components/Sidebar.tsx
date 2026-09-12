import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Building2,
  Zap,
  Bell,
  UserCog,
  Settings,
  Layers,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';

interface SidebarProps {
  onOpenNotifications?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { user, logout } = useAuth();
  const { unreadNotificationCount } = useSocket();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-30">
      <div className="p-5 flex flex-col h-full overflow-y-auto">
        {/* Brand Header */}
        <Link to="/" className="flex items-center gap-3 mb-8 px-2 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
              VELOZITY
            </div>
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Agency Portal
            </div>
          </div>
        </Link>

        {/* Navigation Sections */}
        <div className="space-y-6 flex-1">
          {/* Main Dashboard Link */}
          <div>
            <Link
              to="/"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                location.pathname === '/'
                  ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* WORKSPACE SECTION */}
          <div>
            <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              Workspace
            </div>
            <nav className="space-y-1">
              <Link
                to="/tasks"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname === '/projects'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FolderKanban className="w-4 h-4 text-slate-400" />
                  <span>Projects</span>
                </div>
              </Link>

              <Link
                to="/tasks"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname === '/tasks'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-4 h-4 text-slate-400" />
                  <span>Tasks</span>
                </div>
              </Link>

              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Clients</span>
              </div>

              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Team</span>
              </div>

              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer">
                <Zap className="w-4 h-4 text-slate-400" />
                <span>Activity Feed</span>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Notifications</span>
                </div>
                {unreadNotificationCount > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                    {unreadNotificationCount}
                  </span>
                )}
              </div>
            </nav>
          </div>

          {/* ADMIN SECTION */}
          {user.role === 'ADMIN' && (
            <div>
              <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                Admin
              </div>
              <nav className="space-y-1">
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer">
                  <UserCog className="w-4 h-4 text-slate-400" />
                  <span>User Management</span>
                </div>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </div>
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Profile Bar */}
        <div className="pt-4 border-t border-slate-100 relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {user.role === 'PROJECT_MANAGER' ? 'Project Manager' : user.role === 'DEVELOPER' ? 'Developer' : 'Admin'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute bottom-16 left-2 right-2 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50">
              <div className="p-2.5 border-b border-slate-100 text-xs">
                <p className="font-semibold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
