import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface TaskStatusCounts {
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  DONE: number;
}

export interface TaskPriorityCounts {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

interface TaskStatusDonutChartProps {
  title?: string;
  subtitle?: string;
  totalTasks: number;
  statusCounts: TaskStatusCounts;
  priorityCounts?: TaskPriorityCounts;
  allowTogglePriority?: boolean;
  viewAllLink?: string;
}

// Colors strictly matching user mock:
// To Do: Slate Grey #8a99ad
// In Progress: Vivid Blue #2563eb
// In Review: Warm Amber #f59e0b
// Done: Emerald Green #10b981
const STATUS_CONFIG = [
  { key: 'TODO', label: 'To Do', color: '#8a99ad' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#2563eb' },
  { key: 'IN_REVIEW', label: 'In Review', color: '#f59e0b' },
  { key: 'DONE', label: 'Done', color: '#10b981' },
] as const;

const PRIORITY_CONFIG = [
  { key: 'LOW', label: 'Low', color: '#8a99ad' },
  { key: 'MEDIUM', label: 'Medium', color: '#2563eb' },
  { key: 'HIGH', label: 'High', color: '#f59e0b' },
  { key: 'CRITICAL', label: 'Critical', color: '#ef4444' },
] as const;

export const TaskStatusDonutChart: React.FC<TaskStatusDonutChartProps> = ({
  title = 'Tasks by Status (My Projects)',
  subtitle = 'Status distribution across your projects',
  totalTasks,
  statusCounts,
  priorityCounts,
  allowTogglePriority = false,
  viewAllLink = '/tasks',
}) => {
  const [activeTab, setActiveTab] = useState<'STATUS' | 'PRIORITY'>('STATUS');

  // SVG Donut geometry
  const radius = 54;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  // Choose config based on tab
  const isStatus = activeTab === 'STATUS';
  const displayTitle = isStatus ? title : title.replace('Status', 'Priority');

  // Build segments array
  const segments = isStatus
    ? STATUS_CONFIG.map((cfg) => ({
        label: cfg.label,
        color: cfg.color,
        count: statusCounts[cfg.key] || 0,
      }))
    : PRIORITY_CONFIG.map((cfg) => ({
        label: cfg.label,
        color: cfg.color,
        count: priorityCounts ? priorityCounts[cfg.key] || 0 : 0,
      }));

  const activeTotal = isStatus
    ? totalTasks
    : segments.reduce((sum, s) => sum + s.count, 0) || totalTasks;

  // Compute SVG stroke offsets
  let accumulatedLength = 0;
  const renderedSlices = segments.map((seg) => {
    const fraction = activeTotal > 0 ? seg.count / activeTotal : 0;
    const dashLength = fraction * circumference;
    const offset = -accumulatedLength;
    accumulatedLength += dashLength;
    return {
      ...seg,
      dashLength,
      offset,
    };
  });

  return (
    <div className="dashboard-card p-6 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{displayTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {allowTogglePriority && priorityCounts && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    isStatus
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PRIORITY')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    !isStatus
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Priority
                </button>
              </div>
            )}

            {viewAllLink && (
              <Link
                to={viewAllLink}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 shrink-0"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-6">
          {/* SVG Donut */}
          <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Background base track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
                fill="transparent"
              />

              {/* Colored Slices */}
              {renderedSlices.map((slice, idx) => {
                if (slice.dashLength <= 0) return null;
                return (
                  <circle
                    key={idx}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${slice.dashLength} ${circumference}`}
                    strokeDashoffset={slice.offset}
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                );
              })}
            </svg>

            {/* Center Metrics (e.g. "6 Tasks") */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 leading-none">
                {activeTotal}
              </span>
              <span className="text-xs font-medium text-slate-400 mt-1">Tasks</span>
            </div>
          </div>

          {/* Right Legend */}
          <div className="w-full max-w-[180px] space-y-3.5">
            {segments.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-slate-700">{item.label}</span>
                </div>
                <span className="font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
