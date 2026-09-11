import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  AlertCircle,
  Calendar,
  Plus,
  Briefcase,
  Clock,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { PMDashboardMetrics, Task } from '../types/index.js';
import { ActivityFeed } from '../components/ActivityFeed.js';
import { CreateProjectModal } from '../components/CreateProjectModal.js';
import { CreateTaskModal } from '../components/CreateTaskModal.js';
import { TaskCard } from '../components/TaskCard.js';

export const PMDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { latestTaskUpdate } = useSocket();
  const [metrics, setMetrics] = useState<PMDashboardMetrics | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const loadPMData = async () => {
    try {
      const [dashData, taskData] = await Promise.all([
        apiRequest<PMDashboardMetrics>('/dashboard'),
        apiRequest<{ tasks: Task[] }>('/tasks'),
      ]);
      setMetrics(dashData);
      setMyTasks(taskData.tasks || []);
    } catch (err) {
      console.error('Failed loading PM dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPMData();
  }, [user]);

  // Real-time task status updates
  useEffect(() => {
    if (latestTaskUpdate) {
      setMyTasks((prev) =>
        prev.map((t) => (t.id === latestTaskUpdate.id ? latestTaskUpdate : t))
      );
      apiRequest<PMDashboardMetrics>('/dashboard')
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

  const projects = metrics?.projectsSummary.projects || [];
  const upcomingTasks = metrics?.upcomingDueDatesThisWeek || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Project Manager Portfolio: {user?.name}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
              Scoring RBAC: Own Projects Only
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict isolation enforced at API level: You only have visibility and management rights over projects you created.
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
            onClick={() => {
              setSelectedProjectId(undefined);
              setIsCreateTaskOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-colors shadow-lg shadow-cyan-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Assign Task</span>
          </button>
        </div>
      </div>

      {/* 3 Core PM Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Projects Summary */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Projects Managed</span>
            <div className="p-2 rounded-xl bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {metrics?.projectsSummary.total ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">
            Exclusive ownership created by {user?.name}
          </div>
        </div>

        {/* Metric 2: Tasks by Priority */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tasks By Priority</span>
            <div className="p-2 rounded-xl bg-indigo-950/50 text-indigo-400 border border-indigo-800/40">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px] pt-1">
            <div className="p-1.5 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 text-center">
              <div className="font-bold text-sm">{metrics?.tasksByPriority.CRITICAL ?? 0}</div>
              <div className="text-[9px] uppercase tracking-wider">Critical</div>
            </div>
            <div className="p-1.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-center">
              <div className="font-bold text-sm">{metrics?.tasksByPriority.HIGH ?? 0}</div>
              <div className="text-[9px] uppercase tracking-wider">High</div>
            </div>
            <div className="p-1.5 rounded bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-center">
              <div className="font-bold text-sm">{metrics?.tasksByPriority.MEDIUM ?? 0}</div>
              <div className="text-[9px] uppercase tracking-wider">Medium</div>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-center">
              <div className="font-bold text-sm">{metrics?.tasksByPriority.LOW ?? 0}</div>
              <div className="text-[9px] uppercase tracking-wider">Low</div>
            </div>
          </div>
        </div>

        {/* Metric 3: Upcoming Due Dates This Week */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Due This Week</span>
            <div className="p-2 rounded-xl bg-amber-950/50 text-amber-400 border border-amber-800/40">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {upcomingTasks.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Tasks scheduled within the next 7 days
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: My Projects & Upcoming Due Dates */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Projects Portfolio Cards */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Your Managed Projects</h3>
                <p className="text-xs text-slate-400">
                  You cannot see or edit projects created by other PMs
                </p>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                You have not created any projects yet. Click "New Project" above to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                          {proj.status}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {proj._count?.tasks ?? 0} Tasks
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{proj.name}</h4>
                      {proj.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {proj.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Client: {proj.client?.name}</span>
                      <button
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setIsCreateTaskOpen(true);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                      >
                        <span>+ Task</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Due Dates This Week */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Upcoming Due Dates This Week</h3>
                <p className="text-xs text-slate-400">Urgent deadlines across your projects</p>
              </div>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No tasks due this week across your projects.
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-cyan-400">
                          #{t.taskNumber}
                        </span>
                        <span className="font-semibold text-white">{t.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50">
                          {t.priority}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {t.project?.name} • Assigned to: {t.assignedTo?.name || 'Unassigned'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-300 font-medium whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Project Tasks with Status Transitions */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">All Project Tasks</h3>
                <p className="text-xs text-slate-400">Manage tasks within your projects</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myTasks.slice(0, 6).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdated={(updated) => {
                    setMyTasks((prev) =>
                      prev.map((t) => (t.id === updated.id ? updated : t))
                    );
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: PM-Filtered Live Activity Feed */}
        <div className="lg:col-span-1 min-h-[500px]">
          <ActivityFeed title="Your Projects Feed" />
        </div>
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={() => loadPMData()}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultProjectId={selectedProjectId}
        onTaskCreated={() => loadPMData()}
      />
    </div>
  );
};
