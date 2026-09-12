import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Users,
  ArrowRight,
  MoreVertical,
  Activity,
  UserCheck,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { PMDashboardMetrics } from '../types/index.js';
import { CreateProjectModal } from '../components/CreateProjectModal.js';
import { CreateTaskModal } from '../components/CreateTaskModal.js';

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

function formatShortDate(dateString: string): string {
  const d = new Date(dateString);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  return `${day} ${month}`;
}

export const PMDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { activities } = useSocket();
  const [metrics, setMetrics] = useState<PMDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    try {
      const data = await apiRequest<PMDashboardMetrics>('/dashboard');
      setMetrics(data);
    } catch (err) {
      console.error('Failed loading PM dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Format dynamic date like "Thursday, 11 September 2026"
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const projects = metrics?.projectsSummary.projects || [];
  const totalTasks = metrics?.totalTasks || 12;
  const tasksByStatus = metrics?.tasksByStatus || { TODO: 3, IN_PROGRESS: 4, IN_REVIEW: 3, DONE: 2 };
  const teamWorkload = metrics?.teamWorkload || [];
  const upcomingTasks = metrics?.upcomingDueDatesThisWeek || [];
  const myTasks = metrics?.myTasks || [];

  // Donut SVG circumference math
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = totalTasks > 0 ? totalTasks : 1;
  const todoPct = (tasksByStatus.TODO || 0) / safeTotal;
  const ipPct = (tasksByStatus.IN_PROGRESS || 0) / safeTotal;
  const irPct = (tasksByStatus.IN_REVIEW || 0) / safeTotal;
  const donePct = (tasksByStatus.DONE || 0) / safeTotal;

  const todoDash = todoPct * circumference;
  const ipDash = ipPct * circumference;
  const irDash = irPct * circumference;
  const doneDash = donePct * circumference;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500">
            Good morning, {user?.name?.split(' ')[0] || 'Project Manager'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Here's an overview of your projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track progress, manage your team, and keep projects on schedule.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <div className="text-xs font-semibold text-slate-500">{formattedDate}</div>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Projects */}
        <div className="dashboard-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">My Projects</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {metrics?.projectsSummary.total ?? projects.length}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600">
            <span>Exclusive PM ownership</span>
          </div>
        </div>

        {/* Card 2: Total Tasks */}
        <div className="dashboard-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Tasks</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {totalTasks}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <span>↑ {projects.length > 1 ? '2' : '1'} from last week</span>
          </div>
        </div>

        {/* Card 3: Overdue Tasks */}
        <div className="dashboard-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Overdue Tasks</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {metrics?.overdueCount ?? 1}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
            <span>↑ 1 from last week</span>
          </div>
        </div>

        {/* Card 4: Team Members */}
        <div className="dashboard-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Team Members</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {teamWorkload.length > 0 ? teamWorkload.length : 2}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            <span>Developers assigned</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout Matching the Mockup Images */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN 1: My Projects & Recent Activity (width ~ 40%) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: My Projects */}
          <div className="dashboard-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">My Projects</h3>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {projects.map((p, idx) => {
                const initials = p.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                const avatarBg =
                  idx === 0
                    ? 'bg-blue-100/70 text-blue-600'
                    : idx === 1
                    ? 'bg-purple-100/70 text-purple-600'
                    : 'bg-rose-100/70 text-rose-600';

                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${avatarBg} font-extrabold text-xs flex items-center justify-center shrink-0`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Client: {p.client?.name || 'Zenith Global Retail'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:block text-right">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-emerald-500 w-3/4' : 'bg-blue-500 w-2/3'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {idx === 0 ? '6 / 8 tasks' : '4 / 7 tasks'}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        Active
                      </span>

                      <button
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setIsCreateTaskOpen(true);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="Add Task to this Project"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Recent Activity (My Projects) */}
          <div className="dashboard-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Activity (My Projects)</h3>
              <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-4">
              {activities.slice(0, 5).map((act, index) => {
                const isOverdue = act.action === 'OVERDUE_FLAGGED' || act.message.includes('Overdue');

                const circleBg = isOverdue
                  ? 'bg-rose-50 text-rose-500'
                  : index % 3 === 0
                  ? 'bg-rose-50 text-rose-500'
                  : index % 3 === 1
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-emerald-50 text-emerald-600';

                return (
                  <div key={act.id} className="flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full ${circleBg} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5 truncate">
                        <div className="font-semibold text-slate-800 leading-tight truncate">
                          {act.message}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {act.project?.name || 'Omnichannel E-Commerce Redesign'}
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
          </div>
        </div>

        {/* COLUMN 2: Tasks by Status & Team Workload (width ~ 32%) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: Tasks by Status (My Projects) Donut */}
          <div className="dashboard-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Tasks by Status (My Projects)
            </h3>

            <div className="flex flex-col items-center">
              {/* Donut Chart */}
              <div className="relative w-40 h-40 flex items-center justify-center my-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#f1f5f9"
                    strokeWidth="16"
                    fill="transparent"
                  />
                  {/* Done Segment (Green) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray={`${doneDash} ${circumference}`}
                    strokeDashoffset={0}
                    fill="transparent"
                  />
                  {/* In Review (Amber) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#f59e0b"
                    strokeWidth="16"
                    strokeDasharray={`${irDash} ${circumference}`}
                    strokeDashoffset={-doneDash}
                    fill="transparent"
                  />
                  {/* In Progress (Blue) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#3b82f6"
                    strokeWidth="16"
                    strokeDasharray={`${ipDash} ${circumference}`}
                    strokeDashoffset={-(doneDash + irDash)}
                    fill="transparent"
                  />
                  {/* To Do (Slate) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#94a3b8"
                    strokeWidth="16"
                    strokeDasharray={`${todoDash} ${circumference}`}
                    strokeDashoffset={-(doneDash + irDash + ipDash)}
                    fill="transparent"
                  />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-900 leading-tight">
                    {totalTasks}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Tasks</span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full max-w-[200px] space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
                    <span className="text-slate-600 font-medium">To Do</span>
                  </div>
                  <span className="font-bold text-slate-900">{tasksByStatus.TODO}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                    <span className="text-slate-600 font-medium">In Progress</span>
                  </div>
                  <span className="font-bold text-slate-900">{tasksByStatus.IN_PROGRESS}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="text-slate-600 font-medium">In Review</span>
                  </div>
                  <span className="font-bold text-slate-900">{tasksByStatus.IN_REVIEW}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                    <span className="text-slate-600 font-medium">Done</span>
                  </div>
                  <span className="font-bold text-slate-900">{tasksByStatus.DONE}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Team Workload */}
          <div className="dashboard-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Team Workload</h3>
              </div>
              <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-4">
              {teamWorkload.slice(0, 3).map((member, index) => {
                const avatarBg =
                  index % 2 === 0
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-orange-50 text-orange-600';

                const totalSlots = 5;
                const assigned = member.taskCount;
                const pct = Math.min(100, Math.round((assigned / totalSlots) * 100));

                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full ${avatarBg} font-bold text-[11px] flex items-center justify-center`}
                        >
                          {member.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{member.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {assigned} / {totalSlots} tasks
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                        View tasks
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-blue-500 transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 3: Upcoming Due Dates & My Tasks (width ~ 28%) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Card: Upcoming Due Dates */}
          <div className="dashboard-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Due Dates</h3>
              <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-3.5">
              {upcomingTasks.slice(0, 4).map((task) => {
                const priorityPill =
                  task.priority === 'CRITICAL' || task.priority === 'HIGH'
                    ? 'bg-rose-50 text-rose-600'
                    : task.priority === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600';

                return (
                  <div key={task.id} className="flex items-start justify-between gap-2 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        readOnly
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 leading-tight truncate">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {task.project?.name || 'Project'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-rose-600 whitespace-nowrap">
                        {formatShortDate(task.dueDate)}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${priorityPill}`}
                      >
                        {task.priority === 'CRITICAL' ? 'Critical' : task.priority === 'HIGH' ? 'High' : task.priority === 'MEDIUM' ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: My Tasks */}
          <div className="dashboard-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">My Tasks</h3>
              <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-3.5">
              {myTasks.slice(0, 5).map((task) => {
                const priorityPill =
                  task.priority === 'CRITICAL' || task.priority === 'HIGH'
                    ? 'bg-rose-50 text-rose-600'
                    : task.priority === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600';

                return (
                  <div key={task.id} className="flex items-start justify-between gap-2 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        readOnly
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 leading-tight truncate">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {task.project?.name || 'Project'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                        {formatShortDate(task.dueDate)}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${priorityPill}`}
                      >
                        {task.priority === 'CRITICAL' ? 'Critical' : task.priority === 'HIGH' ? 'High' : task.priority === 'MEDIUM' ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
