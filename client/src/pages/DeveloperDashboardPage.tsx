import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Eye,
  CheckCheck,
  Calendar,
  ArrowRight,
  CheckSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { DeveloperDashboardMetrics, Task, TaskStatus } from '../types/index.js';
import { ActivityFeed } from '../components/ActivityFeed.js';
import { TaskStatusDonutChart } from '../components/TaskStatusDonutChart.js';

export const DeveloperDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const totalTasks = stats?.total ?? assignedTasks.length;

  const devStatusCounts = {
    TODO: stats?.todo ?? 0,
    IN_PROGRESS: stats?.inProgress ?? 0,
    IN_REVIEW: stats?.inReview ?? 0,
    DONE: stats?.done ?? 0,
  };

  const devPriorityCounts = {
    LOW: assignedTasks.filter((t) => t.priority === 'LOW').length,
    MEDIUM: assignedTasks.filter((t) => t.priority === 'MEDIUM').length,
    HIGH: assignedTasks.filter((t) => t.priority === 'HIGH').length,
    CRITICAL: assignedTasks.filter((t) => t.priority === 'CRITICAL').length,
  };

  const upcomingDeadlines = assignedTasks
    .filter((t) => t.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

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

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Assigned */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Assigned Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalTasks}</div>
          <div className="text-xs text-slate-500 mt-1.5">Assigned to your queue</div>
        </div>

        {/* Card 2: In Progress */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.inProgress ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1.5">Currently being developed</div>
        </div>

        {/* Card 3: Completed */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.done ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1.5">
            {totalTasks > 0 ? Math.round(((stats?.done ?? 0) / totalTasks) * 100) : 0}% completion rate
          </div>
        </div>

        {/* Card 4: Overdue */}
        <div
          className={`dashboard-card p-5 ${
            overdueCount > 0 ? 'border-rose-200/80 bg-rose-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${overdueCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              Overdue Tasks
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                overdueCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {overdueCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl font-bold mt-2 ${overdueCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {overdueCount}
          </div>
          <div className={`text-xs mt-1.5 ${overdueCount > 0 ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>
            {overdueCount > 0 ? 'Requires attention' : 'All tasks on schedule'}
          </div>
        </div>
      </div>

      {/* Row 2: Donut Chart & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Donut Chart */}
        <TaskStatusDonutChart
          title="Tasks by Status (Assigned to Me)"
          subtitle="Status distribution of your assigned tasks"
          totalTasks={totalTasks}
          statusCounts={devStatusCounts}
          priorityCounts={devPriorityCounts}
          allowTogglePriority={true}
          viewAllLink="/tasks"
        />

        {/* Right: Upcoming Deadlines */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Upcoming Due Dates</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tasks needing your attention soon</p>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No pending tasks with upcoming due dates.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto pr-1">
                {upcomingDeadlines.map((task) => {
                  const priorityClass =
                    task.priority === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : task.priority === 'HIGH'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : task.priority === 'MEDIUM'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <div
                      key={task.id}
                      className="py-3 flex items-start justify-between gap-3 text-xs first:pt-0 last:pb-0"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="font-semibold text-slate-900 leading-snug truncate">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{task.project?.name || 'Project'}</span>
                          <span>•</span>
                          <span className="capitalize">{task.status.replace('_', ' ').toLowerCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${priorityClass}`}>
                          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

