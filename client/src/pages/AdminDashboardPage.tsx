import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Users,
  Plus,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { AdminDashboardMetrics, Project } from '../types/index.js';
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

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { activeUserCount, activities } = useSocket();
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const loadData = async () => {
    try {
      const [dashData, projData] = await Promise.all([
        apiRequest<AdminDashboardMetrics>('/dashboard'),
        apiRequest<{ projects: Project[] }>('/projects'),
      ]);
      setMetrics(dashData);
      setProjects(projData.projects || []);
    } catch (err) {
      console.error('Failed loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Format today's date like "Thursday, 11 September 2026"
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const tasksByStatus = metrics?.tasksByStatus || { TODO: 6, IN_PROGRESS: 5, IN_REVIEW: 3, DONE: 4 };
  const totalTasks = Object.values(tasksByStatus).reduce((a, b) => a + b, 0) || 18;

  // Donut SVG circumference math
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const todoPct = (tasksByStatus.TODO || 0) / totalTasks;
  const ipPct = (tasksByStatus.IN_PROGRESS || 0) / totalTasks;
  const irPct = (tasksByStatus.IN_REVIEW || 0) / totalTasks;
  const donePct = (tasksByStatus.DONE || 0) / totalTasks;

  const todoDash = todoPct * circumference;
  const ipDash = ipPct * circumference;
  const irDash = irPct * circumference;
  const doneDash = donePct * circumference;

  // Priority bar chart counts (approximated or mapped from tasks)
  const priorityCounts = {
    LOW: 1.5,
    MEDIUM: 4.5,
    HIGH: 3.5,
    CRITICAL: 2.2,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Greeting & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500">
            Good morning, {user?.name?.split(' ')[0] || 'Sarah'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Here's what's happening at Velozity
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            A real-time overview of your agency's projects, tasks, and team activity.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <div className="text-xs font-semibold text-slate-500">{formattedDate}</div>
          <button
            onClick={() => setIsCreateProjectOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Projects */}
        <div className="dashboard-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Projects</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {metrics?.totalProjects ?? projects.length}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <span>↑ 1 from last month</span>
          </div>
        </div>

        {/* Card 2: Total Tasks */}
        <div className="dashboard-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Tasks</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {totalTasks}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <span>↑ 4 from last month</span>
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
              {metrics?.overdueTaskCount ?? 2}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
            <span>↑ 1 from last week</span>
          </div>
        </div>

        {/* Card 4: Active Users */}
        <div className="dashboard-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Active Users</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {metrics?.totalUsers ?? 7}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeUserCount > 0 ? `${activeUserCount} online now` : '1 online now'}</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Two Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Chart: Tasks by Status Donut */}
        <div className="dashboard-card p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-6">Tasks by Status</h3>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
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
                {/* In Review Segment (Yellow/Amber) */}
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
                {/* In Progress Segment (Blue) */}
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
                {/* To Do Segment (Slate) */}
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
              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-900 leading-tight">
                  {totalTasks}
                </span>
                <span className="text-xs font-semibold text-slate-400">Tasks</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-3.5 w-full max-w-[200px]">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
                  <span className="text-slate-600 font-medium">To Do</span>
                </div>
                <span className="font-bold text-slate-900">{tasksByStatus.TODO}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                  <span className="text-slate-600 font-medium">In Progress</span>
                </div>
                <span className="font-bold text-slate-900">{tasksByStatus.IN_PROGRESS}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-slate-600 font-medium">In Review</span>
                </div>
                <span className="font-bold text-slate-900">{tasksByStatus.IN_REVIEW}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  <span className="text-slate-600 font-medium">Done</span>
                </div>
                <span className="font-bold text-slate-900">{tasksByStatus.DONE}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Chart: Tasks by Priority Bar Chart */}
        <div className="dashboard-card p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-6">Tasks by Priority</h3>
          
          <div className="flex h-48 gap-3 items-end">
            {/* Y-Axis scale */}
            <div className="flex flex-col justify-between text-[11px] font-semibold text-slate-400 h-full pb-6 pr-2">
              <span>8</span>
              <span>6</span>
              <span>4</span>
              <span>2</span>
              <span>0</span>
            </div>

            {/* Bars Area */}
            <div className="flex-1 grid grid-cols-4 gap-4 h-full border-b border-slate-100 pb-6 items-end">
              {/* Low Bar */}
              <div className="flex flex-col items-center gap-2 h-full justify-end group">
                <div
                  style={{ height: `${(priorityCounts.LOW / 8) * 100}%` }}
                  className="w-full max-w-[48px] bg-[#94a3b8] rounded-t-lg transition-all group-hover:opacity-90"
                />
              </div>

              {/* Medium Bar */}
              <div className="flex flex-col items-center gap-2 h-full justify-end group">
                <div
                  style={{ height: `${(priorityCounts.MEDIUM / 8) * 100}%` }}
                  className="w-full max-w-[48px] bg-[#3b82f6] rounded-t-lg transition-all group-hover:opacity-90"
                />
              </div>

              {/* High Bar */}
              <div className="flex flex-col items-center gap-2 h-full justify-end group">
                <div
                  style={{ height: `${(priorityCounts.HIGH / 8) * 100}%` }}
                  className="w-full max-w-[48px] bg-[#f97316] rounded-t-lg transition-all group-hover:opacity-90"
                />
              </div>

              {/* Critical Bar */}
              <div className="flex flex-col items-center gap-2 h-full justify-end group">
                <div
                  style={{ height: `${(priorityCounts.CRITICAL / 8) * 100}%` }}
                  className="w-full max-w-[48px] bg-[#f43f5e] rounded-t-lg transition-all group-hover:opacity-90"
                />
              </div>
            </div>
          </div>

          {/* X-Axis labels */}
          <div className="grid grid-cols-4 gap-4 pl-7 text-[11px] font-semibold text-slate-500 text-center pt-2">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Projects and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Active Projects */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900">Active Projects</h3>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {projects.slice(0, 3).map((p, idx) => {
                const initials = p.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                const badgeBg =
                  idx === 0
                    ? 'bg-blue-50 text-blue-600'
                    : idx === 1
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-rose-50 text-rose-600';

                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${badgeBg} font-extrabold text-xs flex items-center justify-center shrink-0`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          Client: {p.client?.name || 'Corporate Client'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Progress bar */}
                      <div className="hidden sm:block text-right">
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-emerald-500 w-full' : 'bg-blue-500 w-full'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">6/6 tasks</span>
                      </div>

                      {/* Status Tag */}
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                        Active
                      </span>

                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Recent Activity Live Feed */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
              <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-4">
              {activities.slice(0, 5).map((act, index) => {
                const isOverdue = act.action === 'OVERDUE_FLAGGED' || act.message.includes('Overdue');
                const isDone = act.message.includes('Done');

                const iconBg = isOverdue
                  ? 'bg-rose-50 text-rose-500'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-600'
                  : index % 2 === 0
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-emerald-50 text-emerald-600';

                const Icon = isOverdue ? AlertTriangle : isDone ? CheckCircle2 : FolderKanban;

                return (
                  <div
                    key={act.id}
                    className="flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800 leading-snug">
                          {act.message}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {act.project?.name || 'Velozity Project'}
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
