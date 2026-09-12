import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  Calendar,
  Layers,
  Plus,
  ArrowRight,
  MoreVertical,
  User,
  RotateCw,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import {
  DeveloperDashboardMetrics,
  Task,
  TaskStatus,
  ActivityItem,
} from '../types/index.js';
import { CreateTaskModal } from '../components/CreateTaskModal.js';

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatShortDate(dateString: string): { day: string; month: string; full: string } {
  const d = new Date(dateString);
  const day = d.getDate().toString();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return {
    day,
    month,
    full: `${day} ${month} ${year}`,
  };
}

export const DeveloperDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { latestTaskUpdate, activities: socketActivities } = useSocket();

  const [metrics, setMetrics] = useState<DeveloperDashboardMetrics | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [dbActivities, setDbActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab filter: ALL | TODO | IN_PROGRESS | IN_REVIEW | DONE
  const [activeTab, setActiveTab] = useState<'ALL' | TaskStatus>('ALL');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const loadDevData = async () => {
    try {
      const [data, actData] = await Promise.all([
        apiRequest<DeveloperDashboardMetrics>('/dashboard'),
        apiRequest<{ activities: ActivityItem[] }>('/activities?limit=15').catch(() => ({ activities: [] })),
      ]);
      setMetrics(data);
      setAssignedTasks(data.assignedTasks || []);
      setDbActivities(actData.activities || []);
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
        if (latestTaskUpdate.assignedToId === user?.id) {
          const exists = prev.some((t) => t.id === latestTaskUpdate.id);
          if (exists) {
            return prev.map((t) => (t.id === latestTaskUpdate.id ? latestTaskUpdate : t));
          }
          return [latestTaskUpdate, ...prev];
        } else {
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

  const handleCheckboxToggle = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';
    await handleQuickStatus(task.id, nextStatus);
  };

  // Merge database activities and real-time socket activities
  const mergedActivities = useMemo(() => {
    const combined: ActivityItem[] = [...socketActivities];
    dbActivities.forEach((act) => {
      if (!combined.some((a) => a.id === act.id)) {
        combined.push(act);
      }
    });
    combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return combined.slice(0, 5);
  }, [socketActivities, dbActivities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
      </div>
    );
  }

  const stats = metrics?.taskStats;
  const totalTasks = stats?.total ?? assignedTasks.length;
  const todoCount = stats?.todo ?? assignedTasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = stats?.inProgress ?? assignedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const inReviewCount = stats?.inReview ?? assignedTasks.filter((t) => t.status === 'IN_REVIEW').length;
  const doneCount = stats?.done ?? assignedTasks.filter((t) => t.status === 'DONE').length;
  const overdueCount = stats?.overdue ?? 0;

  // Filter tasks for table
  const filteredTasks = assignedTasks.filter((task) => {
    if (activeTab === 'ALL') return true;
    return task.status === activeTab;
  });

  // Upcoming due tasks (next upcoming non-done tasks sorted by dueDate)
  const upcomingTasks = [...assignedTasks]
    .filter((t) => t.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const dueThisWeekCount = stats?.dueThisWeek ?? upcomingTasks.length;
  const highPriorityDueCount =
    stats?.highPriorityDueThisWeek ??
    upcomingTasks.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL').length;

  // Participating projects
  const projects = metrics?.participatingProjects || [];
  const projectsCount = projects.length;

  const firstName = user?.name ? user.name.split(' ')[0] : 'Developer';

  // Greeting based on current hour
  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const getPriorityPill = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return (
          <span className="bg-rose-50 text-rose-600 border border-rose-100 font-semibold px-2.5 py-0.5 rounded-md text-[11px]">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="bg-amber-50 text-amber-600 border border-amber-100 font-semibold px-2.5 py-0.5 rounded-md text-[11px]">
            Medium
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 font-semibold px-2.5 py-0.5 rounded-md text-[11px]">
            Low
          </span>
        );
    }
  };

  const getStatusPill = (task: Task) => {
    switch (task.status) {
      case 'IN_PROGRESS':
        return (
          <button
            onClick={() => handleQuickStatus(task.id, 'IN_REVIEW')}
            title="Click to submit for review"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-3 py-1 rounded-md text-xs transition-colors"
          >
            In Progress
          </button>
        );
      case 'IN_REVIEW':
        return (
          <button
            onClick={() => handleQuickStatus(task.id, 'DONE')}
            title="Click to complete"
            className="bg-amber-50 text-amber-600 hover:bg-amber-100 font-semibold px-3 py-1 rounded-md text-xs transition-colors"
          >
            In Review
          </button>
        );
      case 'DONE':
        return (
          <button
            onClick={() => handleQuickStatus(task.id, 'IN_PROGRESS')}
            title="Click to re-open"
            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-semibold px-3 py-1 rounded-md text-xs transition-colors"
          >
            Done
          </button>
        );
      case 'TODO':
      default:
        return (
          <button
            onClick={() => handleQuickStatus(task.id, 'IN_PROGRESS')}
            title="Click to start development"
            className="bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold px-3 py-1 rounded-md text-xs transition-colors"
          >
            To Do
          </button>
        );
    }
  };

  const getProjectInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1">
            {greetingTime}, {firstName}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Here's your work for today
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your tasks, meet your deadlines, and stay updated with your projects.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-slate-500">{formattedDate}</span>
        </div>
      </div>

      {/* 4 Metric KPI Cards matching mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Tasks */}
        <div className="dashboard-card p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">My Tasks</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalTasks}</div>
            </div>
          </div>
          <div className="flex items-center text-xs text-slate-500 font-medium mt-3 pt-2 border-t border-slate-100">
            <span className="w-2 h-2 rounded-full bg-blue-600 mr-2 shrink-0" />
            <span>{inProgressCount} in progress</span>
          </div>
        </div>

        {/* Card 2: Overdue Tasks */}
        <div
          className={`dashboard-card p-5 ${
            overdueCount > 0 ? 'border-rose-200/80 bg-rose-50/10' : ''
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                overdueCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-rose-50 text-rose-500'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span
                className={`text-xs font-medium ${
                  overdueCount > 0 ? 'text-rose-700 font-semibold' : 'text-slate-500'
                }`}
              >
                Overdue Tasks
              </span>
              <div
                className={`text-2xl font-bold mt-0.5 ${
                  overdueCount > 0 ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                {overdueCount}
              </div>
            </div>
          </div>
          <div className="flex items-center text-xs text-slate-500 font-medium mt-3 pt-2 border-t border-slate-100">
            <span
              className={`w-2 h-2 rounded-full mr-2 shrink-0 ${
                overdueCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            />
            <span className={overdueCount > 0 ? 'text-rose-600 font-medium' : ''}>
              {overdueCount > 0 ? 'Needs attention' : 'On track'}
            </span>
          </div>
        </div>

        {/* Card 3: Due This Week */}
        <div className="dashboard-card p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Due This Week</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{dueThisWeekCount}</div>
            </div>
          </div>
          <div className="flex items-center text-xs text-slate-500 font-medium mt-3 pt-2 border-t border-slate-100">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 shrink-0" />
            <span>{highPriorityDueCount} high priority</span>
          </div>
        </div>

        {/* Card 4: My Projects */}
        <div className="dashboard-card p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">My Projects</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{projectsCount}</div>
            </div>
          </div>
          <div className="flex items-center text-xs text-slate-500 font-medium mt-3 pt-2 border-t border-slate-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0" />
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* Middle Row: My Tasks Table & Upcoming Due Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): My Tasks Table */}
        <div className="lg:col-span-8 dashboard-card p-6 flex flex-col justify-between">
          <div>
            {/* Table Header & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">My Tasks</h2>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Filter Tabs Bar & New Task Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    activeTab === 'ALL'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({totalTasks})
                </button>
                <button
                  onClick={() => setActiveTab('TODO')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    activeTab === 'TODO'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  To Do ({todoCount})
                </button>
                <button
                  onClick={() => setActiveTab('IN_PROGRESS')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    activeTab === 'IN_PROGRESS'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  In Progress ({inProgressCount})
                </button>
                <button
                  onClick={() => setActiveTab('IN_REVIEW')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    activeTab === 'IN_REVIEW'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  In Review ({inReviewCount})
                </button>
                <button
                  onClick={() => setActiveTab('DONE')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    activeTab === 'DONE'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Done ({doneCount})
                </button>
              </div>

              <button
                onClick={() => setIsCreateTaskOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            </div>

            {/* Tasks Table */}
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No tasks match the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="py-3 px-2 w-8">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-0"
                          readOnly
                        />
                      </th>
                      <th className="py-3 px-3 font-medium">Task</th>
                      <th className="py-3 px-3 font-medium">Project</th>
                      <th className="py-3 px-3 font-medium">Priority</th>
                      <th className="py-3 px-3 font-medium">Due Date</th>
                      <th className="py-3 px-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.slice(0, 6).map((task) => {
                      const isDone = task.status === 'DONE';
                      const short = formatShortDate(task.dueDate);

                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-slate-50/60 transition-colors group"
                        >
                          <td className="py-3 px-2">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => handleCheckboxToggle(task)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 min-w-[180px]">
                            <span
                              className={`font-semibold text-slate-900 ${
                                isDone ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {task.title}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                            {task.project?.name || 'Project'}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {getPriorityPill(task.priority)}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {short.full}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {getStatusPill(task)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Upcoming Due Dates Card */}
        <div className="lg:col-span-4 dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Upcoming Due Dates</h2>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No upcoming tasks scheduled.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingTasks.map((task) => {
                  const dateParts = formatShortDate(task.dueDate);

                  return (
                    <div
                      key={task.id}
                      className="py-3.5 flex items-center justify-between gap-3 first:pt-1 last:pb-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Day Box */}
                        <div className="flex flex-col items-center justify-center w-10 text-center shrink-0">
                          <span className="text-sm font-bold text-slate-900 leading-none">
                            {dateParts.day}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                            {dateParts.month}
                          </span>
                        </div>

                        {/* Title & Project */}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {task.project?.name || 'Project'}
                          </div>
                        </div>
                      </div>

                      {/* Priority Badge */}
                      <div className="shrink-0">{getPriorityPill(task.priority)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: My Projects & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: My Projects Card */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">My Projects</h2>
              <Link
                to="/projects"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No active projects assigned yet.
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((proj, idx) => {
                  const initials = getProjectInitials(proj.name);
                  const isPurple = idx % 2 === 0;
                  const total = proj.totalTasks || 1;
                  const done = proj.doneTasks || 0;
                  const pct = Math.min(100, Math.round((done / total) * 100));

                  return (
                    <div
                      key={proj.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Project Initial Avatar */}
                        <div
                          className={`w-11 h-11 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                            isPurple
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {initials}
                        </div>

                        {/* Title & PM */}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {proj.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            PM: {proj.pmName}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Status */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:flex flex-col items-end w-28">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-400 mt-1">
                            {done} / {total} tasks
                          </span>
                        </div>

                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                          Active
                        </span>

                        <button
                          type="button"
                          onClick={() => navigate('/projects')}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Card */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
              <Link
                to="/activity"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {mergedActivities.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No recent activity recorded.
              </div>
            ) : (
              <div className="space-y-3.5">
                {mergedActivities.map((act, idx) => {
                  // Determine icon and color based on action or role
                  const isMove =
                    act.action?.includes('STATUS') || act.message?.includes('moved');
                  const isAssign =
                    act.action?.includes('ASSIGN') || act.message?.includes('assigned');
                  const isComment =
                    act.action?.includes('COMMENT') || act.message?.includes('commented');

                  return (
                    <div
                      key={act.id || idx}
                      className="flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Action Icon */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isAssign
                              ? 'bg-blue-50 text-blue-600'
                              : isMove
                              ? 'bg-emerald-50 text-emerald-600'
                              : isComment
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-rose-50 text-rose-500'
                          }`}
                        >
                          {isAssign ? (
                            <User className="w-4 h-4" />
                          ) : isMove ? (
                            <RotateCw className="w-4 h-4" />
                          ) : isComment ? (
                            <MessageSquare className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 leading-snug">
                            {act.message}
                          </div>
                          {act.project?.name && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {act.project.name}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                        {formatRelativeTime(act.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          onTaskCreated={(newTask) => {
            setAssignedTasks((prev) => [newTask, ...prev]);
            setIsCreateTaskOpen(false);
          }}
        />
      )}
    </div>
  );
};
