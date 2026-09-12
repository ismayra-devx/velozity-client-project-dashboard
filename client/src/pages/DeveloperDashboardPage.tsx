import React, { useEffect, useState } from 'react';
import {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
      </div>
    );
  }

  const stats = metrics?.taskStats;
  const overdueCount = stats?.overdue ?? 0;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Developer Dashboard</h1>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Assigned Tasks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, {user?.name}. Only tasks assigned directly to you are visible here.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500">{formattedDate}</span>
        </div>
      </div>

      {/* Task Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Tasks */}
        <div className="dashboard-card p-4">
          <span className="text-xs font-medium text-slate-500">Total Tasks</span>
          <div className="text-2xl font-bold text-slate-900 mt-1.5">{stats?.total ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Assigned to you</div>
        </div>

        {/* Card 2: To Do */}
        <div className="dashboard-card p-4">
          <span className="text-xs font-medium text-slate-500">To Do</span>
          <div className="text-2xl font-bold text-slate-700 mt-1.5">{stats?.todo ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Ready to start</div>
        </div>

        {/* Card 3: In Progress */}
        <div className="dashboard-card p-4">
          <span className="text-xs font-medium text-slate-500">In Progress</span>
          <div className="text-2xl font-bold text-blue-600 mt-1.5">{stats?.inProgress ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active development</div>
        </div>

        {/* Card 4: In Review */}
        <div className="dashboard-card p-4">
          <span className="text-xs font-medium text-slate-500">In Review</span>
          <div className="text-2xl font-bold text-amber-600 mt-1.5">{stats?.inReview ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pending PM review</div>
        </div>

        {/* Card 5: Done */}
        <div className="dashboard-card p-4">
          <span className="text-xs font-medium text-slate-500">Completed</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1.5">{stats?.done ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Delivered</div>
        </div>

        {/* Card 6: Overdue */}
        <div
          className={`dashboard-card p-4 ${
            overdueCount > 0 ? 'border-rose-200/80 bg-rose-50/20' : ''
          }`}
        >
          <span className={`text-xs font-medium ${overdueCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
            Overdue
          </span>
          <div className={`text-2xl font-bold mt-1.5 ${overdueCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {overdueCount}
          </div>
          <div className={`text-[11px] mt-1 ${overdueCount > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>
            {overdueCount > 0 ? 'Requires attention' : 'On track'}
          </div>
        </div>
      </div>

      {/* Main Grid: Priority-Sorted Tasks + Developer's Real-Time Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assigned Tasks sorted by Priority then Due Date */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Your Assigned Tasks</h2>
              <p className="text-xs text-slate-500">
                Sorted strictly by priority (Critical &rarr; High &rarr; Medium &rarr; Low), then due date
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {assignedTasks.length} {assignedTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {assignedTasks.length === 0 ? (
            <div className="dashboard-card p-12 text-center text-slate-400 text-xs">
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
                    className="dashboard-card p-4 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                          #{task.taskNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            task.priority === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : task.priority === 'MEDIUM'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                          {task.project?.name}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Quick 1-Click Status Controls for Developers */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="text-[11px] font-semibold text-slate-500">
                        Status:{' '}
                        <span className="text-slate-900 font-bold">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
                          <button
                            onClick={() => handleQuickStatus(task.id, 'IN_PROGRESS')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Start
                          </button>
                        )}

                        {task.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleQuickStatus(task.id, 'IN_REVIEW')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Submit Review
                          </button>
                        )}

                        {task.status === 'IN_REVIEW' && (
                          <button
                            onClick={() => handleQuickStatus(task.id, 'DONE')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Complete
                          </button>
                        )}

                        {task.status === 'DONE' && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
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
        <div className="lg:col-span-1 min-h-[460px]">
          <ActivityFeed title="Your Task Updates" />
        </div>
      </div>
    </div>
  );
};

