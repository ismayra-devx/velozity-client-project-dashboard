import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Calendar } from 'lucide-react';

export const TaskFilterBar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStatus = searchParams.get('status') || '';
  const currentPriority = searchParams.get('priority') || '';
  const dueDateFrom = searchParams.get('dueDateFrom') || '';
  const dueDateTo = searchParams.get('dueDateTo') || '';

  const updateParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(currentStatus || currentPriority || dueDateFrom || dueDateTo);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters (Shareable URL)</span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 transition-colors font-semibold"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Status
          </label>
          <select
            value={currentStatus}
            onChange={(e) => updateParam('status', e.target.value)}
            className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Priority
          </label>
          <select
            value={currentPriority}
            onChange={(e) => updateParam('priority', e.target.value)}
            className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Due Date From */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-600" />
            Due Date From
          </label>
          <input
            type="date"
            value={dueDateFrom}
            onChange={(e) => updateParam('dueDateFrom', e.target.value)}
            className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Due Date To */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-600" />
            Due Date To
          </label>
          <input
            type="date"
            value={dueDateTo}
            onChange={(e) => updateParam('dueDateTo', e.target.value)}
            className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
