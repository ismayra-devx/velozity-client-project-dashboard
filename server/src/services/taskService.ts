import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import { AuthUser } from '../types/index.js';
import { CreateTaskInput, UpdateTaskInput, TaskQueryInput } from '../validators/taskValidator.js';
import { broadcastActivity, broadcastTaskUpdate, broadcastNotification } from '../lib/socket.js';

function formatStatus(status: TaskStatus): string {
  switch (status) {
    case 'TODO':
      return 'To Do';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'IN_REVIEW':
      return 'In Review';
    case 'DONE':
      return 'Done';
    default:
      return status;
  }
}

export async function listTasks(user: AuthUser, query: TaskQueryInput) {
  const where: Prisma.TaskWhereInput = {};

  // Enforce role isolation
  if (user.role === 'DEVELOPER') {
    // Developers can ONLY view tasks assigned to them
    where.assignedToId = user.id;
  } else if (user.role === 'PROJECT_MANAGER') {
    // PMs can only see tasks from projects they created
    where.project = {
      createdById: user.id,
    };
  }

  // Filters
  if (query.projectId) {
    where.projectId = query.projectId;
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.priority) {
    where.priority = query.priority;
  }
  if (query.assignedToId && user.role !== 'DEVELOPER') {
    where.assignedToId = query.assignedToId;
  }
  if (query.dueDateFrom || query.dueDateTo) {
    where.dueDate = {};
    if (query.dueDateFrom) {
      where.dueDate.gte = new Date(query.dueDateFrom);
    }
    if (query.dueDateTo) {
      where.dueDate.lte = new Date(query.dueDateTo);
    }
  }

  // Developer dashboard requires sorting by priority then due date
  const orderBy: Prisma.TaskOrderByWithRelationInput[] =
    user.role === 'DEVELOPER'
      ? [{ priority: 'desc' }, { dueDate: 'asc' }]
      : [{ dueDate: 'asc' }, { createdAt: 'desc' }];

  return prisma.task.findMany({
    where,
    include: {
      project: {
        select: { id: true, name: true, createdById: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy,
  });
}

export async function getTaskById(taskId: string, user: AuthUser) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: { id: true, name: true, createdById: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
      activityLogs: {
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Strict role isolation check
  if (user.role === 'DEVELOPER' && task.assignedToId !== user.id) {
    throw new AppError('Forbidden: Developers can only view their own assigned tasks', 403);
  }

  if (user.role === 'PROJECT_MANAGER' && task.project.createdById !== user.id) {
    throw new AppError('Forbidden: You can only view tasks within your own projects', 403);
  }

  return task;
}

export async function createTask(input: CreateTaskInput, user: AuthUser) {
  // Check project access
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (user.role === 'PROJECT_MANAGER' && project.createdById !== user.id) {
    throw new AppError('Forbidden: You can only add tasks to projects you created', 403);
  }

  // Verify assigned developer exists and has DEVELOPER role
  const developer = await prisma.user.findUnique({
    where: { id: input.assignedToId },
  });

  if (!developer || developer.role !== 'DEVELOPER') {
    throw new AppError('Assigned user must be an existing Developer', 400);
  }

  const dueDate = new Date(input.dueDate);
  const isOverdue = dueDate < new Date() && input.priority !== 'DONE' as any;

  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate,
      isOverdue,
      assignedToId: input.assignedToId,
    },
    include: {
      project: {
        select: { id: true, name: true, createdById: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Create initial activity log entry
  const activityMessage = `${user.name} created Task #${task.taskNumber}: "${task.title}"`;
  const activity = await prisma.taskActivityLog.create({
    data: {
      taskId: task.id,
      projectId: task.projectId,
      userId: user.id,
      action: 'TASK_CREATED',
      toStatus: task.status,
      message: activityMessage,
    },
    include: {
      user: {
        select: { id: true, name: true, role: true },
      },
      task: {
        select: { id: true, taskNumber: true, title: true, assignedToId: true },
      },
    },
  });

  // In-app Notification for Developer
  const notification = await prisma.notification.create({
    data: {
      userId: developer.id,
      taskId: task.id,
      title: 'New Task Assigned',
      message: `You were assigned to Task #${task.taskNumber}: "${task.title}" in ${project.name}`,
    },
  });

  // Real-time WebSocket emissions
  broadcastNotification(developer.id, notification);
  broadcastActivity(activity);
  broadcastTaskUpdate(task);

  return task;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, user: AuthUser) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: { id: true, name: true, createdById: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Strict authorization: Developer can only update their own task
  if (user.role === 'DEVELOPER' && task.assignedToId !== user.id) {
    throw new AppError('Forbidden: You can only update the status of tasks assigned to you', 403);
  }

  // PM can only update tasks within their own project
  if (user.role === 'PROJECT_MANAGER' && task.project.createdById !== user.id) {
    throw new AppError('Forbidden: You can only update tasks in projects you created', 403);
  }

  if (task.status === newStatus) {
    return task;
  }

  const oldStatus = task.status;
  const isOverdue = newStatus === 'DONE' ? false : task.dueDate < new Date();

  // Update task in database
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      isOverdue,
    },
    include: {
      project: {
        select: { id: true, name: true, createdById: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Format activity message exactly as specified:
  // "Ravi moved Task #12 from In Progress → In Review · 2 mins ago"
  const formattedMessage = `${user.name} moved Task #${task.taskNumber} from ${formatStatus(oldStatus)} → ${formatStatus(newStatus)}`;

  // Record activity in database
  const activity = await prisma.taskActivityLog.create({
    data: {
      taskId: task.id,
      projectId: task.projectId,
      userId: user.id,
      action: 'STATUS_UPDATE',
      fromStatus: oldStatus,
      toStatus: newStatus,
      message: formattedMessage,
    },
    include: {
      user: {
        select: { id: true, name: true, role: true },
      },
      task: {
        select: { id: true, taskNumber: true, title: true, assignedToId: true },
      },
    },
  });

  // In-app Notification: When moved to 'IN_REVIEW', the PM who owns the project receives a notification
  if (newStatus === 'IN_REVIEW' && task.project.createdById) {
    const pmNotification = await prisma.notification.create({
      data: {
        userId: task.project.createdById,
        taskId: task.id,
        title: 'Task Ready For Review',
        message: `${user.name} moved Task #${task.taskNumber} ("${task.title}") to In Review`,
      },
    });
    broadcastNotification(task.project.createdById, pmNotification);
  }

  // Real-time broadcast
  broadcastActivity(activity);
  broadcastTaskUpdate(updatedTask);

  return updatedTask;
}

export async function updateTask(taskId: string, input: UpdateTaskInput, user: AuthUser) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: { id: true, name: true, createdById: true },
      },
    },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Developer cannot edit task details other than status
  if (user.role === 'DEVELOPER') {
    throw new AppError('Forbidden: Developers cannot edit task details, only status updates are permitted', 403);
  }

  // PM can only update their own project's tasks
  if (user.role === 'PROJECT_MANAGER' && task.project.createdById !== user.id) {
    throw new AppError('Forbidden: You can only edit tasks within projects you created', 403);
  }

  const data: Prisma.TaskUpdateInput = {};
  if (input.title) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.priority) data.priority = input.priority;
  if (input.dueDate) {
    const due = new Date(input.dueDate);
    data.dueDate = due;
    data.isOverdue = due < new Date() && task.status !== 'DONE';
  }

  let newlyAssigned = false;
  if (input.assignedToId && input.assignedToId !== task.assignedToId) {
    data.assignedTo = { connect: { id: input.assignedToId } };
    newlyAssigned = true;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      project: {
        select: { id: true, name: true, createdById: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (newlyAssigned && input.assignedToId) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.assignedToId,
        taskId: updatedTask.id,
        title: 'Task Reassigned',
        message: `You have been assigned to Task #${updatedTask.taskNumber}: "${updatedTask.title}"`,
      },
    });
    broadcastNotification(input.assignedToId, notification);
  }

  broadcastTaskUpdate(updatedTask);
  return updatedTask;
}
