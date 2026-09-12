import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, LogOut, CheckCheck, Clock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const TopHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useSocket();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
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
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="w-full max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search projects, tasks, or teammates..."
          className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
        />
      </div>

      {/* Right Status & Controls */}
      <div className="flex items-center gap-6">
        {/* WebSocket Live Status */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
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
          <span className="text-slate-600 font-medium">
            {isConnected ? 'WebSocket Connected' : 'Connecting...'}
          </span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
                  <p className="text-[11px] text-slate-400">Live WebSocket updates</p>
                </div>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 flex items-start justify-between gap-3 text-xs transition-colors ${
                        n.isRead ? 'bg-white text-slate-500' : 'bg-blue-50/40 text-slate-900'
                      } hover:bg-slate-50`}
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-800">{n.title}</div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(n.createdAt)}</span>
                        </div>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-md"
                          title="Mark read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
              <div className="text-[10px] text-slate-400 font-medium">
                {user.role === 'PROJECT_MANAGER' ? 'Project Manager' : user.role === 'DEVELOPER' ? 'Developer' : 'Admin'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-100 text-xs">
                <div className="font-semibold text-slate-900 truncate">{user.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
