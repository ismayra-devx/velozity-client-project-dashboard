import React, { useEffect, useState } from 'react';
import {
  Code2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { DeveloperDashboardMetrics, Task, TaskStatus } from '../types/index.js';
import { ActivityFeed } from '../components/ActivityFeed.js';


export const DeveloperDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { latestTaskUpdate } = useSocket();
  const [metrics, setMetrics] = useState<DeveloperDashboardMetrics | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDevData = async () => {
    try {
      const data = await apiRequest<DeveloperDashboardMetrics>('/dashboard');
      setMetrics(data);
      setAssignedTasks(data.assignedTasks || []);
    } catch (err) {
      console.error('Failed loading developer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevData();
  }, [user]);

  // Synchronize real-time task status updates
  useEffect(() => {
    if (latestTaskUpdate) {
      setAssignedTasks((prev) => {
        // If assigned to current dev, update or add
        if (latestTaskUpdate.assignedToId === user?.id) {
          const exists = prev.some((t) => t.id === latestTaskUpdate.id);
          if (exists) {
            return prev.map((t) => (t.id === latestTaskUpdate.id ? latestTaskUpdate : t));
          }
          return [latestTaskUpdate, ...prev];
        } else {
          // If reassigned away, remove
          return prev.filter((t) => t.id !== latestTaskUpdate.id);
        }
      });
      // Refresh metrics count
      apiRequest<DeveloperDashboardMetrics>('/dashboard')
        .then(setMetrics)
        .catch(console.error);
    }
  }, [latestTaskUpdate, user]);

  const handleQuickStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await apiRequest<{ task: Task }>(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setAssignedTasks((prev) =>
        prev.map((t) => (t.id === taskId ? res.task : t))
      );
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  const stats = metrics?.taskStats;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Developer Workstation: {user?.name}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              Assigned Tasks Only
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict role isolation: You can only view and update tasks assigned to you. Other developers’ tasks remain inaccessible.
          </p>
        </div>
      </div>

      {/* Task Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-xs font-semibold text-slate-400">Total Tasks</div>
          <div className="text-2xl font-extrabold text-white mt-1">{stats?.total ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-xs font-semibold text-slate-400">To Do</div>
          <div className="text-2xl font-extrabold text-slate-300 mt-1">{stats?.todo ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-xs font-semibold text-cyan-400">In Progress</div>
          <div className="text-2xl font-extrabold text-cyan-400 mt-1">{stats?.inProgress ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-xs font-semibold text-amber-400">In Review</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{stats?.inReview ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-xs font-semibold text-emerald-400">Done</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats?.done ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-xs font-semibold text-rose-400">Overdue</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{stats?.overdue ?? 0}</div>
        </div>
      </div>

      {/* Main Grid: Priority-Sorted Tasks + Developer's Real-Time Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Assigned Tasks sorted by Priority then Due Date */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Your Assigned Tasks</h3>
              <p className="text-xs text-slate-400">
                Sorted strictly by priority (Critical &rarr; Low), then due date
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {assignedTasks.length} Active
            </span>
          </div>

          {assignedTasks.length === 0 ? (
            <div className="rounded-2xl glass-panel p-12 text-center text-slate-400 border border-slate-800">
              No tasks currently assigned to you.
            </div>
          ) : (
            <div className="space-y-3">
              {assignedTasks.map((task) => {
                const isOverdue =
                  task.isOverdue || (task.status !== 'DONE' && new Date(task.dueDate) < new Date());

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl glass-panel-interactive border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                          #{task.taskNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            task.priority === 'CRITICAL'
                              ? 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-800/50'
                              : task.priority === 'MEDIUM'
                              ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/50'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[11px] font-medium text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {task.project?.name}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50 animate-pulse flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white leading-tight">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Quick 1-Click Status Controls for Developers */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="text-[11px] font-semibold text-slate-400">
                        Status: <span className="text-cyan-400 font-bold">{task.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
                          <button
                            onClick={() => handleQuickStatus(task.id, 'IN_PROGRESS')}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900/60 border border-cyan-800 transition-colors"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Start
                          </button>
                        )}

                        {task.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleQuickStatus(task.id, 'IN_REVIEW')}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-950 text-amber-300 hover:bg-amber-900/60 border border-amber-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Submit Review
                          </button>
                        )}

                        {task.status === 'IN_REVIEW' && (
                          <button
                            onClick={() => handleQuickStatus(task.id, 'DONE')}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Complete
                          </button>
                        )}

                        {task.status === 'DONE' && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Developer's Assigned Live Activity Feed */}
        <div className="lg:col-span-1 min-h-[500px]">
          <ActivityFeed title="Your Task Updates" />
        </div>
      </div>
    </div>
  );
};
