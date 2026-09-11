import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useSocket } from '../context/SocketContext.js';
import { Task } from '../types/index.js';
import { TaskFilterBar } from '../components/TaskFilterBar.js';
import { TaskCard } from '../components/TaskCard.js';

export const TasksPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { latestTaskUpdate } = useSocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const queryString = searchParams.toString();
      const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
      const data = await apiRequest<{ tasks: Task[] }>(endpoint);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch filtered tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time synchronization
  useEffect(() => {
    if (latestTaskUpdate) {
      setTasks((prev) =>
        prev.map((t) => (t.id === latestTaskUpdate.id ? latestTaskUpdate : t))
      );
    }
  }, [latestTaskUpdate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Task Explorer & URL-Shareable Filters
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter by status, priority, and date range. Filter states are stored in URL query parameters and can be directly shared.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTasks()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50">
            {tasks.length} Matching
          </span>
        </div>
      </div>

      {/* URL Filter Bar */}
      <TaskFilterBar />

      {/* Task Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl glass-panel p-16 text-center text-slate-400 border border-slate-800">
          <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No tasks match your filter criteria</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting or clearing your filters above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusUpdated={(updated) => {
                setTasks((prev) =>
                  prev.map((t) => (t.id === updated.id ? updated : t))
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
