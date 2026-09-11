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
    <div className="rounded-2xl glass-panel p-5 border border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white">{title}</h3>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
              <Radio className="w-3 h-3 animate-pulse" />
              {isConnected ? 'Real-Time' : 'Syncing'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{getRoleFeedDescription()}</p>
        </div>

        <button
          onClick={() => refreshActivities()}
          className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
          title="Catch up missed events from DB"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No activity events recorded yet.
          </div>
        ) : (
          displayedActivities.map((item) => {
            const timeAgo = formatRelativeTime(item.createdAt);
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800/80 transition-all text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-slate-200 font-medium leading-relaxed">
                      {item.message}
                    </p>
                    {item.project && (
                      <span className="inline-block text-[11px] font-semibold text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/40">
                        {item.project.name}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1 shrink-0 pt-0.5">
                    <Clock className="w-3 h-3" />
                    {timeAgo}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Offline recovery: Last 20 events DB-synced</span>
        <span className="font-mono text-cyan-400">{displayedActivities.length} items</span>
      </div>
    </div>
  );
};
