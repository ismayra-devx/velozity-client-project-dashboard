import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Layers,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useSocket } from '../context/SocketContext.js';
import { ActivityItem, Project } from '../types/index.js';

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

export const ActivityFeedPage: React.FC = () => {
  const { activities: socketActivities, isConnected, refreshActivities } = useSocket();

  const [dbActivities, setDbActivities] = useState<ActivityItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const loadData = async () => {
    try {
      const [actData, projData] = await Promise.all([
        apiRequest<{ activities: ActivityItem[] }>('/activities?limit=50'),
        apiRequest<{ projects: Project[] }>('/projects'),
      ]);
      setDbActivities(actData.activities || []);
      setProjects(projData.projects || []);
    } catch (err) {
      console.error('Failed loading activity feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Merge socket and DB activities without duplicates
  const merged: ActivityItem[] = [...socketActivities];
  dbActivities.forEach((act) => {
    if (!merged.some((a) => a.id === act.id)) {
      merged.push(act);
    }
  });
  merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Distinct users in the activity feed for filter dropdown
  const distinctUsers = Array.from(
    new Map(
      merged
        .filter((a) => a.user)
        .map((a) => [a.user.id, a.user.name])
    ).entries()
  );

  // Apply filters
  const filteredActivities = merged.filter((act) => {
    const matchesProject =
      projectFilter === 'ALL' || act.projectId === projectFilter;
    const matchesUser =
      userFilter === 'ALL' || act.user?.id === userFilter;
    const matchesAction =
      actionFilter === 'ALL' ||
      (actionFilter === 'OVERDUE' && (act.action === 'OVERDUE_FLAGGED' || act.message.includes('Overdue'))) ||
      (actionFilter === 'DONE' && (act.message.includes('DONE') || act.message.includes('Done'))) ||
      (actionFilter === 'IN_REVIEW' && (act.message.includes('IN_REVIEW') || act.message.includes('In Review'))) ||
      (actionFilter === 'IN_PROGRESS' && (act.message.includes('IN_PROGRESS') || act.message.includes('In Progress')));

    return matchesProject && matchesUser && matchesAction;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Feed</h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full border border-slate-200">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{isConnected ? 'Live WebSocket' : 'Connecting'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit trail of task status transitions, milestone completions, and team operations.
          </p>
        </div>

        <button
          onClick={() => {
            loadData();
            refreshActivities();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Row: All Projects | All Users | All Activity */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-wrap items-center gap-4">
        {/* Project Filter */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Filter by Project
          </label>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* User Filter */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Filter by User
          </label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="ALL">All Users</option>
            {distinctUsers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Activity / Action Filter */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Filter by Activity Type
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="ALL">All Activity</option>
            <option value="IN_PROGRESS">Moved to In Progress</option>
            <option value="IN_REVIEW">Moved to In Review</option>
            <option value="DONE">Completed / Done</option>
            <option value="OVERDUE">Overdue Alerts</option>
          </select>
        </div>
      </div>

      {/* Activity Feed List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="dashboard-card p-16 text-center text-slate-500">
          <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No activity logs match criteria</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your filter options above.
          </p>
        </div>
      ) : (
        <div className="dashboard-card divide-y divide-slate-100 overflow-hidden">
          {filteredActivities.map((act) => {
            const isOverdue =
              act.action === 'OVERDUE_FLAGGED' || act.message.includes('Overdue');
            const isDone = act.message.includes('DONE') || act.message.includes('Done');
            const actorName = act.user?.name || 'System';
            const projectName = act.project?.name || 'Velozity';
            const roleLabel =
              act.user?.role === 'PROJECT_MANAGER'
                ? 'PM'
                : act.user?.role === 'DEVELOPER'
                ? 'Dev'
                : act.user?.role === 'ADMIN'
                ? 'Admin'
                : '';

            return (
              <div
                key={act.id}
                className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors text-xs"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isOverdue
                        ? 'bg-rose-100 text-rose-700'
                        : isDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isOverdue ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="text-slate-800 leading-snug">
                      <span className="font-semibold text-slate-900">{actorName}</span>
                      {roleLabel && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200">
                          {roleLabel}
                        </span>
                      )}{' '}
                      <span className="text-slate-700">{act.message}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-medium text-slate-600">{projectName}</span>
                      {act.task && (
                        <>
                          <span>•</span>
                          <span>Task #{act.task.taskNumber}: {act.task.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 pt-0.5">
                  {formatRelativeTime(act.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
