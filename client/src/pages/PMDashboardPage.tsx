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
  Calendar,
  Layers,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { PMDashboardMetrics, Task, ActivityItem } from '../types/index.js';
import { CreateProjectModal } from '../components/CreateProjectModal.js';
import { CreateTaskModal } from '../components/CreateTaskModal.js';

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

function formatShortDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export const PMDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    activities: socketActivities,
    joinProjectRoom,
    leaveProjectRoom,
    latestTaskUpdate,
  } = useSocket();

  const [metrics, setMetrics] = useState<PMDashboardMetrics | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [dbActivities, setDbActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    try {
      const [dashData, taskData, actData] = await Promise.all([
        apiRequest<PMDashboardMetrics>('/dashboard'),
        apiRequest<{ tasks: Task[] }>('/tasks'),
        apiRequest<{ activities: ActivityItem[] }>('/activities?limit=20').catch(() => ({ activities: [] })),
      ]);
      setMetrics(dashData);
      setAllTasks(taskData.tasks || []);
      setDbActivities(actData.activities || []);

      // Subscribe to WebSocket rooms for this PM's projects
      if (dashData?.projectsSummary?.projects) {
        dashData.projectsSummary.projects.forEach((p) => {
          joinProjectRoom(p.id);
        });
      }
    } catch (err) {
      console.error('Failed loading PM dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (metrics?.projectsSummary?.projects) {
        metrics.projectsSummary.projects.forEach((p) => {
          leaveProjectRoom(p.id);
        });
      }
    };
  }, [user]);

  // Handle incoming real-time task updates
  useEffect(() => {
    if (latestTaskUpdate) {
      setAllTasks((prev) =>
        prev.map((t) => (t.id === latestTaskUpdate.id ? latestTaskUpdate : t))
      );
    }
  }, [latestTaskUpdate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
      </div>
    );
  }

  const projects = metrics?.projectsSummary.projects || [];
  const totalTasks = metrics?.totalTasks ?? allTasks.length;
  const overdueCount = metrics?.overdueCount ?? 0;
  const teamWorkload = metrics?.teamWorkload || [];
  const upcomingTasks = metrics?.upcomingDueDatesThisWeek || [];

  const tasksByPriority = metrics?.tasksByPriority || {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  const tasksByStatus = metrics?.tasksByStatus || {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
  };

  const completedTasksCount = tasksByStatus.DONE || 0;
  const completedPct = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
  const activeProjectsCount = projects.filter((p) => p.status === 'ACTIVE').length;

  // Merge database activities and real-time socket activities for this PM's projects only
  const pmProjectIds = new Set(projects.map((p) => p.id));
  const mergedActivities: ActivityItem[] = [];

  const addUniqueActivity = (act: ActivityItem) => {
    // Only include activities belonging to this PM's projects
    if (act.projectId && pmProjectIds.has(act.projectId)) {
      if (!mergedActivities.some((a) => a.id === act.id)) {
        mergedActivities.push(act);
      }
    }
  };

  socketActivities.forEach(addUniqueActivity);
  dbActivities.forEach(addUniqueActivity);
  mergedActivities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of your projects, team workload, and upcoming deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500 hidden md:inline">{formattedDate}</span>
          <button
            onClick={() => {
              setSelectedProjectId(undefined);
              setIsCreateTaskOpen(true);
            }}
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
        {/* Card 1: My Projects */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">My Projects</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{projects.length}</div>
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
            {completedTasksCount} completed ({completedPct}%)
          </div>
        </div>

        {/* Card 3: Overdue Tasks - Highlighted only when overdue > 0 */}
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

        {/* Card 4: Team Members */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Team Members</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{teamWorkload.length}</div>
          <div className="text-xs text-slate-500 mt-1.5">Developers working on your projects</div>
        </div>
      </div>

      {/* Row 2: Tasks by Priority & Upcoming Due Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tasks by Priority */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Tasks by Priority</h2>
                <p className="text-xs text-slate-500 mt-0.5">Priority distribution across your projects</p>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {totalTasks === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No tasks found for your projects.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Low Priority */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Low</span>
                    <span className="font-semibold text-slate-900">
                      {tasksByPriority.LOW || 0}{' '}
                      <span className="text-slate-400 font-normal">
                        ({totalTasks > 0 ? Math.round(((tasksByPriority.LOW || 0) / totalTasks) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${totalTasks > 0 ? ((tasksByPriority.LOW || 0) / totalTasks) * 100 : 0}%`,
                      }}
                      className="h-full bg-slate-400 rounded-full transition-all"
                    />
                  </div>
                </div>

                {/* Medium Priority */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Medium</span>
                    <span className="font-semibold text-slate-900">
                      {tasksByPriority.MEDIUM || 0}{' '}
                      <span className="text-slate-400 font-normal">
                        ({totalTasks > 0 ? Math.round(((tasksByPriority.MEDIUM || 0) / totalTasks) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${totalTasks > 0 ? ((tasksByPriority.MEDIUM || 0) / totalTasks) * 100 : 0}%`,
                      }}
                      className="h-full bg-blue-500 rounded-full transition-all"
                    />
                  </div>
                </div>

                {/* High Priority */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">High</span>
                    <span className="font-semibold text-slate-900">
                      {tasksByPriority.HIGH || 0}{' '}
                      <span className="text-slate-400 font-normal">
                        ({totalTasks > 0 ? Math.round(((tasksByPriority.HIGH || 0) / totalTasks) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${totalTasks > 0 ? ((tasksByPriority.HIGH || 0) / totalTasks) * 100 : 0}%`,
                      }}
                      className="h-full bg-amber-500 rounded-full transition-all"
                    />
                  </div>
                </div>

                {/* Critical Priority */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Critical</span>
                    <span className="font-semibold text-slate-900">
                      {tasksByPriority.CRITICAL || 0}{' '}
                      <span className="text-slate-400 font-normal">
                        ({totalTasks > 0 ? Math.round(((tasksByPriority.CRITICAL || 0) / totalTasks) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${totalTasks > 0 ? ((tasksByPriority.CRITICAL || 0) / totalTasks) * 100 : 0}%`,
                      }}
                      className="h-full bg-rose-500 rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Upcoming Due Dates */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Upcoming Due Dates</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tasks scheduled for this week</p>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No upcoming tasks due this week.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto pr-1">
                {upcomingTasks.slice(0, 5).map((task) => {
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
                          {task.assignedTo && (
                            <>
                              <span>•</span>
                              <span>{task.assignedTo.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatShortDate(task.dueDate)}</span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${priorityClass}`}
                        >
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

      {/* Row 3: Team Workload & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Team Workload */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Team Workload</h2>
                <p className="text-xs text-slate-500 mt-0.5">Developers assigned to your project tasks</p>
              </div>
            </div>

            {teamWorkload.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No developers currently assigned to your project tasks.
              </div>
            ) : (
              <div className="space-y-4">
                {teamWorkload.map((member) => {
                  const initials = member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const capacity = Math.max(5, member.taskCount);
                  const pct = Math.min(100, Math.round((member.taskCount / capacity) * 100));

                  return (
                    <div key={member.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{member.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {member.taskCount} {member.taskCount === 1 ? 'task' : 'tasks'} assigned
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/tasks?assignedToId=${member.id}`)}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                        >
                          <span>View tasks</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-blue-600 rounded-full transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time updates across your projects</p>
              </div>
            </div>

            {mergedActivities.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No recent activity recorded for your projects.
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {mergedActivities.slice(0, 6).map((act) => {
                  const isOverdue =
                    act.action === 'OVERDUE_FLAGGED' || act.message.includes('Overdue');
                  const isDone = act.message.includes('DONE') || act.message.includes('Done');
                  const actorName = act.user?.name || 'Team member';
                  const projectName = act.project?.name || 'Project';
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

      {/* Row 4: My Projects Detailed Overview */}
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">My Projects</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Projects created and managed by you with real-time completion tracking
            </p>
          </div>
          <button
            onClick={() => setIsCreateProjectOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-600">No projects found</p>
            <p className="mt-0.5">Click "Create Project" above to start managing your first project.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map((p) => {
              const initials = p.name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              const clientName = p.client?.name || p.client?.company || 'Internal Client';

              // Calculate real metrics for this project from allTasks
              const projectTasks = allTasks.filter((t) => t.projectId === p.id);
              const taskCount = projectTasks.length > 0 ? projectTasks.length : p._count?.tasks ?? 0;
              const projectDoneTasks = projectTasks.filter((t) => t.status === 'DONE').length;
              const progressPct = taskCount > 0 ? Math.round((projectDoneTasks / taskCount) * 100) : 0;

              // Extract assigned developers for this project
              const assignedDevelopers = Array.from(
                new Set(
                  projectTasks
                    .map((t) => t.assignedTo?.name)
                    .filter((name): name is string => Boolean(name))
                )
              );

              return (
                <div
                  key={p.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {p.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Client: <span className="text-slate-700 font-medium">{clientName}</span>
                      </div>
                      {/* Developers assigned */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400">Assigned:</span>
                        {assignedDevelopers.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            {assignedDevelopers.map((devName) => (
                              <span
                                key={devName}
                                className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
                              >
                                {devName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 md:justify-end">
                    {/* Task Progress Bar */}
                    <div className="w-32 text-right">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Progress</span>
                        <span className="font-semibold text-slate-800">
                          {projectDoneTasks}/{taskCount} ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${progressPct}%` }}
                          className={`h-full rounded-full transition-all ${
                            progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setIsCreateTaskOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Add task to this project"
                      >
                        + Task
                      </button>
                      <button
                        onClick={() => navigate(`/tasks?projectId=${p.id}`)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        title="View project tasks"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={() => loadData()}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultProjectId={selectedProjectId}
        onTaskCreated={() => loadData()}
      />
    </div>
  );
};
