import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthUser } from '../types/index.js';

export async function getActivities(user: AuthUser, limit = 20, projectId?: string) {
  const where: Prisma.TaskActivityLogWhereInput = {};

  if (projectId) {
    where.projectId = projectId;
  }

  // Strict role-filtered feed enforcement
  if (user.role === 'DEVELOPER') {
    // Developer sees activity only on tasks assigned to them
    where.task = {
      assignedToId: user.id,
    };
  } else if (user.role === 'PROJECT_MANAGER') {
    // PM sees activity only from their own projects
    where.project = {
      createdById: user.id,
    };
  }
  // Admin sees activity across all projects in single global feed (no restriction)

  return prisma.taskActivityLog.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, role: true },
      },
      task: {
        select: { id: true, taskNumber: true, title: true, assignedToId: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 100),
  });
}

// Explicit offline catchup endpoint
export async function getMissedActivities(user: AuthUser, limit = 20) {
  return getActivities(user, limit);
}
