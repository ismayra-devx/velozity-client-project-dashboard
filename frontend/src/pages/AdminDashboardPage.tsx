import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  CheckCheck,
  Check,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useSocket } from '../context/SocketContext.js';
import { AdminDashboardMetrics, Project, ActivityItem } from '../types/index.js';
import { CreateProjectModal } from '../components/CreateProjectModal.js';
import { CreateTaskModal } from '../components/CreateTaskModal.js';
import { TaskStatusDonutChart } from '../components/TaskStatusDonutChart.js';

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

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeUserCount,
    activities: socketActivities,
    latestTaskUpdate,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useSocket();

  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dbActivities, setDbActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const loadData = async () => {
    try {
      const [dashData, projData, actData] = await Promise.all([
        apiRequest<AdminDashboardMetrics>('/dashboard'),
        apiRequest<{ projects: Project[] }>('/projects'),
        apiRequest<{ activities: ActivityItem[] }>('/activities?limit=20').catch(() => ({ activities: [] })),
      ]);
      setMetrics(dashData);
      setProjects(projData.projects || []);
      setDbActivities(actData.activities || []);
    } catch (err) {
      console.error('Failed loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Synchronize live task updates to refresh dashboard metrics & charts in real time
  useEffect(() => {
    if (latestTaskUpdate) {
      apiRequest<AdminDashboardMetrics>('/dashboard')
        .then(setMetrics)
        .catch(() => {});
    }
  }, [latestTaskUpdate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
      </div>
    );
  }

  // Merge database activities and real-time socket activities without duplicates
  const mergedActivities: ActivityItem[] = [...socketActivities];
  dbActivities.forEach((act) => {
    if (!mergedActivities.some((a) => a.id === act.id)) {
      mergedActivities.push(act);
    }
  });
  mergedActivities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const tasksByStatus = metrics?.tasksByStatus || {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
  };

  const totalTasks =
    (tasksByStatus.TODO || 0) +
    (tasksByStatus.IN_PROGRESS || 0) +
    (tasksByStatus.IN_REVIEW || 0) +
    (tasksByStatus.DONE || 0);

  const activeProjectsCount = projects.filter((p) => p.status === 'ACTIVE').length;
  const overdueCount = metrics?.overdueTaskCount ?? 0;
  const onlineCount = activeUserCount ?? metrics?.activeUsersOnline ?? 0;


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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of agency projects, task progression, and active members.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500 hidden md:inline">{formattedDate}</span>
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
          <button
            onClick={() => setIsCreateProjectOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Projects */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Projects</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics?.totalProjects ?? projects.length}
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            {activeProjectsCount} active {activeProjectsCount === 1 ? 'project' : 'projects'}
          </div>
        </div>

        {/* Card 2: Total Tasks */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalTasks}</div>
          <div className="text-xs text-slate-500 mt-1.5">
            {tasksByStatus.DONE || 0} completed ({totalTasks > 0 ? Math.round(((tasksByStatus.DONE || 0) / totalTasks) * 100) : 0}%)
          </div>
        </div>

        {/* Card 3: Overdue Tasks - Only card that uses restrained red when > 0 */}
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

        {/* Card 4: Active Users */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Users</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{onlineCount}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Online now · {metrics?.totalUsers ?? 7} registered</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Tasks by Status & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tasks by Status Donut Pie Chart matching user reference mockup */}
        <TaskStatusDonutChart
          title="Tasks by Status"
          subtitle="Distribution across all agency projects"
          totalTasks={totalTasks}
          statusCounts={tasksByStatus}
          priorityCounts={metrics?.tasksByPriority}
          allowTogglePriority={true}
          viewAllLink="/tasks"
        />

        {/* Right: Notifications */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
                {unreadNotificationCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-100 rounded-full border border-slate-200">
                    {unreadNotificationCount} unread
                  </span>
                )}
              </div>
              {unreadNotificationCount > 0 && (
                <button
                  onClick={() => markAllNotificationsRead()}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No notifications to display.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto pr-1">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={`py-3 flex items-start justify-between gap-3 text-xs transition-colors ${
                      n.isRead ? 'opacity-70' : 'opacity-100'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-snug">
                        {n.title}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed truncate">
                        {n.message}
                      </p>
                      <div className="text-[10px] text-slate-400">
                        {formatRelativeTime(n.createdAt)}
                      </div>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markNotificationRead(n.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Projects & Global Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Projects */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Active Projects</h2>
                <p className="text-xs text-slate-500 mt-0.5">Projects currently under management</p>
              </div>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add project</span>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No active projects found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {projects.slice(0, 4).map((p) => {
                  const initials = p.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const clientName = p.client?.name || p.client?.company || 'Internal';
                  const taskCount = p._count?.tasks ?? p.tasks?.length ?? 0;

                  return (
                    <div
                      key={p.id}
                      className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            Client: {clientName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {p.status}
                        </span>
                        <button
                          onClick={() => navigate('/tasks')}
                          className="text-xs font-medium text-slate-500 hover:text-slate-900 p-1"
                          title="View tasks"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Global Activity Feed */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
                <p className="text-xs text-slate-500 mt-0.5">Global audit trail across all operations</p>
              </div>
            </div>

            {mergedActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No activity recorded yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {mergedActivities.slice(0, 6).map((act) => {
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
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-700'
                              : isDone
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200/80 text-slate-700'
                          }`}
                        >
                          {isOverdue ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[10px] font-bold">
                              {actorName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs text-slate-800 leading-snug">
                            <span className="font-semibold text-slate-900">{actorName}</span>
                            {roleLabel && (
                              <span className="ml-1.5 px-1 py-0.2 text-[9px] font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200">
                                {roleLabel}
                              </span>
                            )}{' '}
                            <span className="text-slate-600">{act.message}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span className="font-medium text-slate-600">{projectName}</span>
                            {act.task && (
                              <>
                                <span>•</span>
                                <span>Task #{act.task.taskNumber}</span>
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
        </div>
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          loadData();
        }}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreated={() => {
          loadData();
        }}
      />
    </div>
  );
};

