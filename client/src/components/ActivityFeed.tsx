import React from 'react';
import { Activity, Radio, RefreshCw, Clock } from 'lucide-react';
import { useSocket } from '../context/SocketContext.js';
import { useAuth } from '../context/AuthContext.js';

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hrs ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

interface ActivityFeedProps {
  title?: string;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  title = 'Live Activity Feed',
  maxItems = 25,
}) => {
  const { activities, isConnected, refreshActivities } = useSocket();
  const { user } = useAuth();

  const displayedActivities = activities.slice(0, maxItems);

  const getRoleFeedDescription = () => {
    if (user?.role === 'ADMIN') return 'Global stream across all projects';
    if (user?.role === 'PROJECT_MANAGER') return 'Stream for your created projects';
    return 'Stream for your assigned tasks';
  };

  return (
    <div className="dashboard-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">{title}</h3>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              {isConnected ? 'Real-Time' : 'Syncing'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{getRoleFeedDescription()}</p>
        </div>

        <button
          onClick={() => refreshActivities()}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Refresh activities from database"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No activity events recorded yet.
          </div>
        ) : (
          displayedActivities.map((item) => {
            const timeAgo = formatRelativeTime(item.createdAt);
            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 transition-all text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {item.message}
                    </p>
                    {item.project && (
                      <span className="inline-block text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.project.name}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 shrink-0 pt-0.5">
                    <Clock className="w-3 h-3" />
                    {timeAgo}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Offline recovery: Last 20 events DB-synced</span>
        <span className="font-mono text-slate-400">{displayedActivities.length} events</span>
      </div>
    </div>
  );
};
