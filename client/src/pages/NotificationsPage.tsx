import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
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

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useSocket();

  const [tab, setTab] = useState<'ALL' | 'UNREAD'>('ALL');

  const filtered = notifications.filter((n) => {
    if (tab === 'UNREAD') return !n.isRead;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
            {unreadNotificationCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-full border border-slate-200">
                {unreadNotificationCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Task assignments, review requests, and milestone notices.
          </p>
        </div>

        {unreadNotificationCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            tab === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setTab('UNREAD')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            tab === 'UNREAD'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Unread Only ({unreadNotificationCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="dashboard-card p-16 text-center text-slate-500">
          <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">
            {tab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            System notices and review requests will be delivered here via real-time WebSocket.
          </p>
        </div>
      ) : (
        <div className="dashboard-card divide-y divide-slate-100 overflow-hidden">
          {filtered.map((n) => {
            const isReview = n.title.includes('Review');
            const isOverdue = n.title.includes('Overdue');

            return (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  n.isRead ? 'bg-white text-slate-500' : 'bg-slate-50/50 text-slate-900'
                } hover:bg-slate-50`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isOverdue
                        ? 'bg-rose-100 text-rose-700'
                        : isReview
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isOverdue ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isReview ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-xs leading-snug truncate ${
                          n.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'
                        }`}
                      >
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <div className="text-[10px] text-slate-400">
                      {formatRelativeTime(n.createdAt)}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markNotificationRead(n.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
