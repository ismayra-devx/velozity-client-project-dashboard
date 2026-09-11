import { prisma } from '../lib/prisma.js';
import { AuthUser } from '../types/index.js';
import { getActiveUserCount } from '../lib/socket.js';

export async function getDashboardData(user: AuthUser) {
  if (user.role === 'ADMIN') {
    const [
      totalProjects,
      tasksByStatusRaw,
      overdueTaskCount,
      totalUsers,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.task.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.task.count({
        where: {
          OR: [
            { isOverdue: true },
            {
              status: { not: 'DONE' },
              dueDate: { lt: new Date() },
            },
          ],
        },
      }),
      prisma.user.count(),
    ]);

    const tasksByStatus: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };
    tasksByStatusRaw.forEach((item) => {
      tasksByStatus[item.status] = item._count._all;
    });

    const activeUsersOnline = getActiveUserCount();

    return {
      role: 'ADMIN',
      totalProjects,
      totalUsers,
      tasksByStatus,
      overdueTaskCount,
      activeUsersOnline,
    };
  }

  if (user.role === 'PROJECT_MANAGER') {
    const now = new Date();
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      projects,
      tasksByPriorityRaw,
      upcomingTasksThisWeek,
      overdueCount,
    ] = await Promise.all([
      prisma.project.findMany({
        where: { createdById: user.id },
        include: {
          client: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: {
          project: { createdById: user.id },
        },
        _count: { _all: true },
      }),
      prisma.task.findMany({
        where: {
          project: { createdById: user.id },
          status: { not: 'DONE' },
          dueDate: {
            gte: now,
            lte: endOfWeek,
          },
        },
        include: {
          assignedTo: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.task.count({
        where: {
          project: { createdById: user.id },
          status: { not: 'DONE' },
          dueDate: { lt: now },
        },
      }),
    ]);

    const tasksByPriority: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    tasksByPriorityRaw.forEach((item) => {
      tasksByPriority[item.priority] = item._count._all;
    });

    return {
      role: 'PROJECT_MANAGER',
      projectsSummary: {
        total: projects.length,
        projects,
      },
      tasksByPriority,
      upcomingDueDatesThisWeek: upcomingTasksThisWeek,
      overdueCount,
    };
  }

  // DEVELOPER DASHBOARD
  const assignedTasks = await prisma.task.findMany({
    where: { assignedToId: user.id },
    include: {
      project: { select: { id: true, name: true } },
    },
    // Required: sorted by priority then due date
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
    ],
  });

  const taskStats = {
    total: assignedTasks.length,
    todo: assignedTasks.filter((t) => t.status === 'TODO').length,
    inProgress: assignedTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    inReview: assignedTasks.filter((t) => t.status === 'IN_REVIEW').length,
    done: assignedTasks.filter((t) => t.status === 'DONE').length,
    overdue: assignedTasks.filter((t) => t.isOverdue || (t.status !== 'DONE' && new Date(t.dueDate) < new Date())).length,
  };

  return {
    role: 'DEVELOPER',
    taskStats,
    assignedTasks,
  };
}
