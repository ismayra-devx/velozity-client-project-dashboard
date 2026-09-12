import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  Layers,
  Search,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Project, Task } from '../types/index.js';
import { CreateProjectModal } from '../components/CreateProjectModal.js';
import { CreateTaskModal } from '../components/CreateTaskModal.js';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    try {
      const [projData, taskData] = await Promise.all([
        apiRequest<{ projects: Project[] }>('/projects'),
        apiRequest<{ tasks: Task[] }>('/tasks'),
      ]);
      setProjects(projData.projects || []);
      setTasks(taskData.tasks || []);
    } catch (err) {
      console.error('Failed loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client?.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage client deliverables, monitor task progression, and assign teams.
          </p>
        </div>

        <button
          onClick={() => setIsCreateProjectOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {['ALL', 'ACTIVE', 'PLANNING', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="dashboard-card p-16 text-center text-slate-500">
          <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No projects found</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? 'Try changing your search or filter settings.'
              : 'Click "New Project" to create your first project.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((p) => {
            const projectTasks = tasks.filter((t) => t.projectId === p.id);
            const totalCount = projectTasks.length > 0 ? projectTasks.length : p._count?.tasks ?? 0;
            const doneCount = projectTasks.filter((t) => t.status === 'DONE').length;
            const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

            const clientName = p.client?.name || p.client?.company || 'Internal Client';
            const initials = p.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const assignedDevs = Array.from(
              new Set(
                projectTasks
                  .map((t) => t.assignedTo?.name)
                  .filter((n): n is string => Boolean(n))
              )
            );

            return (
              <div
                key={p.id}
                className="dashboard-card p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Client: {clientName}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {p.status}
                    </span>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Project Metadata: Task Count & Due Date */}
                  <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-slate-100 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Total Tasks</span>
                      <span className="font-semibold text-slate-800">{totalCount} tasks</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Timeline</span>
                      <span className="font-semibold text-slate-800">
                        {projectTasks.length > 0
                          ? `Due ${new Date(Math.max(...projectTasks.map((t) => new Date(t.dueDate).getTime()))).toLocaleDateString()}`
                          : 'Active Sprint'}
                      </span>
                    </div>
                  </div>

                  {/* Task Progress */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Progress</span>
                      <span className="font-semibold text-slate-800">
                        {doneCount}/{totalCount} completed ({progressPct}%)
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

                  {/* Assigned Team */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-slate-400">Assigned developers:</span>
                    <div className="flex items-center gap-1">
                      {assignedDevs.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">None yet</span>
                      ) : (
                        assignedDevs.slice(0, 3).map((dev) => (
                          <span
                            key={dev}
                            className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
                          >
                            {dev}
                          </span>
                        ))
                      )}
                      {assignedDevs.length > 3 && (
                        <span className="text-[10px] text-slate-400">
                          +{assignedDevs.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setIsCreateTaskOpen(true);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Task</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setIsCreateTaskOpen(true);
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors"
                    >
                      Assign Developer
                    </button>
                  </div>

                  <button
                    onClick={() => navigate(`/tasks?projectId=${p.id}`)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <span>View Tasks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
