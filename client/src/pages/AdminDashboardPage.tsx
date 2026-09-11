import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Users,
  Plus,
  Shield,
  Layers,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useSocket } from '../context/SocketContext.js';
import { AdminDashboardMetrics, Project, Task } from '../types/index.js';
import { ActivityFeed } from '../components/ActivityFeed.js';
import { CreateProjectModal } from '../components/CreateProjectModal.js';
import { CreateTaskModal } from '../components/CreateTaskModal.js';
import { TaskCard } from '../components/TaskCard.js';

export const AdminDashboardPage: React.FC = () => {
  const { activeUserCount, onlineUsers, latestTaskUpdate } = useSocket();
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [dashData, projData, taskData] = await Promise.all([
        apiRequest<AdminDashboardMetrics>('/dashboard'),
        apiRequest<{ projects: Project[] }>('/projects'),
        apiRequest<{ tasks: Task[] }>('/tasks'),
      ]);
      setMetrics(dashData);
      setProjects(projData.projects || []);
      setRecentTasks(taskData.tasks ? taskData.tasks.slice(0, 6) : []);
    } catch (err) {
      console.error('Failed loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Listen to real-time task updates
  useEffect(() => {
    if (latestTaskUpdate) {
      setRecentTasks((prev) =>
        prev.map((t) => (t.id === latestTaskUpdate.id ? latestTaskUpdate : t))
      );
      // Re-fetch metrics count in background
      apiRequest<AdminDashboardMetrics>('/dashboard')
        .then(setMetrics)
        .catch(console.error);
    }
  }, [latestTaskUpdate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Admin Executive Overview</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/60">
              Full System Access
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Global monitoring across all agency clients, projects, tasks, and real-time WebSocket feeds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateProjectOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>New Project</span>
          </button>
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors shadow-lg shadow-cyan-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metrics required by assessment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Projects */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Projects</span>
            <div className="p-2 rounded-xl bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {metrics?.totalProjects ?? projects.length}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Across all corporate clients</span>
          </div>
        </div>

        {/* Metric 2: Total Tasks by Status */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tasks By Status</span>
            <div className="p-2 rounded-xl bg-indigo-950/50 text-indigo-400 border border-indigo-800/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics ? Object.values(metrics.tasksByStatus).reduce((a, b) => a + b, 0) : 0}
            </span>
            <span className="text-xs text-slate-400">total tasks</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px] pt-1">
            <span className="px-1 py-0.5 rounded bg-slate-900 text-slate-300 text-center font-semibold">
              TD: {metrics?.tasksByStatus.TODO ?? 0}
            </span>
            <span className="px-1 py-0.5 rounded bg-cyan-950/60 text-cyan-300 text-center font-semibold">
              IP: {metrics?.tasksByStatus.IN_PROGRESS ?? 0}
            </span>
            <span className="px-1 py-0.5 rounded bg-amber-950/60 text-amber-300 text-center font-semibold">
              IR: {metrics?.tasksByStatus.IN_REVIEW ?? 0}
            </span>
            <span className="px-1 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-center font-semibold">
              DN: {metrics?.tasksByStatus.DONE ?? 0}
            </span>
          </div>
        </div>

        {/* Metric 3: Overdue Task Count */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Overdue Tasks</span>
            <div className="p-2 rounded-xl bg-rose-950/50 text-rose-400 border border-rose-800/40">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400">
            {metrics?.overdueTaskCount ?? 0}
          </div>
          <div className="text-[11px] text-rose-300/80">
            Flagged automatically by background cron scheduler
          </div>
        </div>

        {/* Metric 4: Active Users Online Right Now (WebSocket presence live count) */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Users Online</span>
            <div className="p-2 rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {activeUserCount}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Presence
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {onlineUsers.length > 0
              ? onlineUsers.map((u) => u.name.split(' ')[0]).join(', ')
              : 'Tracking WebSocket heartbeats'}
          </div>
        </div>
      </div>

      {/* Main Grid: Projects, Tasks, and Live Global Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Projects and Recent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Projects Table */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Active Agency Projects</h3>
                <p className="text-xs text-slate-400">All projects across Project Managers</p>
              </div>
              <span className="text-xs text-slate-400">{projects.length} Total</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {projects.map((proj) => (
                <div key={proj.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white hover:text-cyan-400 transition-colors">
                        {proj.name}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {proj.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Client: {proj.client?.name}</span>
                      <span>•</span>
                      <span>PM: {proj.createdBy?.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-cyan-400">
                        {proj._count?.tasks ?? 0} Tasks
                      </div>
                      <div className="text-[10px] text-slate-500">Tracked</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Latest Tasks Overview</h3>
                <p className="text-xs text-slate-400">Real-time status tracking</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdated={(updated) => {
                    setRecentTasks((prev) =>
                      prev.map((t) => (t.id === updated.id ? updated : t))
                    );
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live Global Activity Feed (Admin sees all projects) */}
        <div className="lg:col-span-1 min-h-[500px]">
          <ActivityFeed title="Global Activity Feed" />
        </div>
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          loadDashboardData();
        }}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreated={(newTask) => {
          setRecentTasks((prev) => [newTask, ...prev]);
          loadDashboardData();
        }}
      />
    </div>
  );
};
