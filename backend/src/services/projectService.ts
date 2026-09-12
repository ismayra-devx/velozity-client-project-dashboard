import { prisma } from '../lib/prisma.js';
import { joinUserSocketsToRoom } from '../lib/socket.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import { AuthUser } from '../types/index.js';
import { CreateProjectInput, UpdateProjectInput } from '../validators/projectValidator.js';

export async function listProjects(user: AuthUser) {
  if (user.role === 'ADMIN') {
    return prisma.project.findMany({
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (user.role === 'PROJECT_MANAGER') {
    // PM can only see projects they created
    return prisma.project.findMany({
      where: { createdById: user.id },
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // DEVELOPER sees only projects where they have assigned tasks
  return prisma.project.findMany({
    where: {
      tasks: {
        some: { assignedToId: user.id },
      },
    },
    include: {
      client: true,
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProjectById(projectId: string, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      tasks: {
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Enforce access boundary
  if (user.role === 'PROJECT_MANAGER' && project.createdById !== user.id) {
    throw new AppError('Forbidden: You can only access projects you created', 403);
  }

  if (user.role === 'DEVELOPER') {
    const hasAssignedTask = project.tasks.some((t) => t.assignedToId === user.id);
    if (!hasAssignedTask) {
      throw new AppError('Forbidden: You do not have access to this project', 403);
    }
    // Filter tasks so developer only sees their own assigned tasks
    project.tasks = project.tasks.filter((t) => t.assignedToId === user.id);
  }

  return project;
}

export async function createProject(input: CreateProjectInput, user: AuthUser) {
  // Verify client exists
  const client = await prisma.client.findUnique({
    where: { id: input.clientId },
  });
  if (!client) {
    throw new AppError('Client not found', 404);
  }

  const newProject = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      status: input.status || 'ACTIVE',
      clientId: input.clientId,
      createdById: user.id,
    },
    include: {
      client: true,
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  // Automatically subscribe creating PM's active sockets to the new project room
  joinUserSocketsToRoom(user.id, `room:project_${newProject.id}`);

  return newProject;
}

export async function updateProject(projectId: string, input: UpdateProjectInput, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (user.role === 'PROJECT_MANAGER' && project.createdById !== user.id) {
    throw new AppError('Forbidden: You cannot edit another Project Manager’s project', 403);
  }

  return prisma.project.update({
    where: { id: projectId },
    data: input,
    include: {
      client: true,
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}
