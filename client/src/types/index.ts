export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  clientId: string;
  client?: Client;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  taskNumber: number;
  projectId: string;
  project?: {
    id: string;
    name: string;
    createdById?: string;
  };
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  assignedToId: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  taskId: string;
  projectId: string;
  action: string;
  message: string;
  fromStatus?: TaskStatus | null;
  toStatus?: TaskStatus | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: Role;
  };
  task?: {
    id: string;
    taskNumber: number;
    title: string;
    assignedToId: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  taskId?: string | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminDashboardMetrics {
  role: 'ADMIN';
  totalProjects: number;
  totalUsers: number;
  tasksByStatus: Record<TaskStatus, number>;
  overdueTaskCount: number;
  activeUsersOnline: number;
}

export interface PMDashboardMetrics {
  role: 'PROJECT_MANAGER';
  projectsSummary: {
    total: number;
    projects: Project[];
  };
  tasksByPriority: Record<TaskPriority, number>;
  upcomingDueDatesThisWeek: Task[];
  overdueCount: number;
}

export interface DeveloperDashboardMetrics {
  role: 'DEVELOPER';
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
    overdue: number;
  };
  assignedTasks: Task[];
}

export type DashboardMetrics = AdminDashboardMetrics | PMDashboardMetrics | DeveloperDashboardMetrics;
