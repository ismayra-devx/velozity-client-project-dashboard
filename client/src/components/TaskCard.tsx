import React, { useState } from 'react';
import { Clock, AlertTriangle, User } from 'lucide-react';
import { Task, TaskStatus } from '../types/index.js';
import { apiRequest } from '../services/api.js';

interface TaskCardProps {
  task: Task;
  onStatusUpdated?: (updatedTask: Task) => void;
  canChangeStatus?: boolean;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  HIGH: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  LOW: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusUpdated,
  canChangeStatus = true,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status || isUpdating) return;
    setIsUpdating(true);
    try {
      const data = await apiRequest<{ task: Task }>(`/tasks/${task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (onStatusUpdated && data.task) {
        onStatusUpdated(data.task);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const isOverdue = task.isOverdue || (task.status !== 'DONE' && new Date(task.dueDate) < new Date());

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              #{task.taskNumber}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
            >
              {task.priority}
            </span>
          </div>

          {isOverdue && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1 hover:text-blue-600 transition-colors">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {task.description}
          </p>
        )}

        {/* Project Tag */}
        {task.project && (
          <div className="inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md mb-2">
            {task.project.name}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[130px] font-medium text-slate-700">
              {task.assignedTo?.name || 'Unassigned'}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 text-[11px] font-medium ${
              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Status Selector */}
        {canChangeStatus ? (
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500 shrink-0">Status:</label>
            <select
              value={task.status}
              disabled={isUpdating}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="w-full text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 text-slate-800 px-2.5 py-1.5 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Current Status:</span>
            <span className="font-semibold text-blue-600">{task.status.replace('_', ' ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
