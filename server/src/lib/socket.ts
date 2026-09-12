import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthUser } from '../types/index.js';

let io: SocketIOServer | null = null;

// Map: userId -> Set of socket IDs (to support multiple tabs/connections per user)
const activeUsers = new Map<string, { user: AuthUser; socketIds: Set<string> }>();

export interface ActivityFeedItem {
  id: string;
  taskId: string;
  projectId: string;
  action: string;
  message: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  createdAt: Date | string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  task?: {
    id: string;
    taskNumber: number;
    title: string;
    assignedToId: string;
  };
}

import { prisma } from './prisma.js';
import { getActivities } from '../services/activityService.js';

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for WebSocket handshake
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret) as AuthUser;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user: AuthUser = socket.data.user;

    // Register active user connection
    if (!activeUsers.has(user.id)) {
      activeUsers.set(user.id, { user, socketIds: new Set([socket.id]) });
    } else {
      activeUsers.get(user.id)!.socketIds.add(socket.id);
    }

    // 1. Personal user room for direct notifications and developer assigned-task activity
    socket.join(`user:${user.id}`);

    // 2. Admins automatically join the global feed room (all projects)
    if (user.role === 'ADMIN') {
      socket.join('room:global_feed');
    }

    // 3. Project Managers automatically join project rooms for their owned projects only
    if (user.role === 'PROJECT_MANAGER') {
      try {
        const pmProjects = await prisma.project.findMany({
          where: { createdById: user.id },
          select: { id: true },
        });
        pmProjects.forEach((p) => {
          socket.join(`room:project_${p.id}`);
        });
      } catch (err) {
        console.error('Failed joining PM project rooms:', err);
      }
    }

    // Broadcast presence update (active user count & active users list)
    broadcastPresence();

    // 4. Missed event catchup directly on connection:
    // Query PostgreSQL for the last 20 role-filtered activity records
    try {
      const missedActivities = await getActivities(user, 20);
      socket.emit('activity:catchup', missedActivities);
    } catch (err) {
      console.error('Failed to query missed activities for catchup:', err);
    }

    // Secure client subscription to specific project updates with RBAC enforcement
    socket.on('project:join', async (projectId: string) => {
      if (!projectId) return;

      if (user.role === 'ADMIN') {
        socket.join(`room:project_${projectId}`);
        return;
      }

      if (user.role === 'PROJECT_MANAGER') {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { createdById: true },
        });
        // PM can only join rooms for projects they created
        if (project && project.createdById === user.id) {
          socket.join(`room:project_${projectId}`);
        } else {
          socket.emit('error', { message: 'Forbidden: You do not have access to this project room' });
        }
        return;
      }

      // Developers only receive activity for their assigned tasks via user room
      socket.emit('error', { message: 'Forbidden: Developers cannot join project-wide broadcast rooms' });
    });

    socket.on('project:leave', (projectId: string) => {
      socket.leave(`room:project_${projectId}`);
    });

    socket.on('disconnect', () => {
      const entry = activeUsers.get(user.id);
      if (entry) {
        entry.socketIds.delete(socket.id);
        if (entry.socketIds.size === 0) {
          activeUsers.delete(user.id);
        }
      }
      broadcastPresence();
    });
  });

  return io;
}

export function joinUserSocketsToRoom(userId: string, room: string) {
  if (!io) return;
  const userEntry = activeUsers.get(userId);
  if (userEntry) {
    userEntry.socketIds.forEach((socketId) => {
      const socket = io!.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(room);
      }
    });
  }
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized');
  }
  return io;
}

export function broadcastPresence() {
  if (!io) return;
  const count = activeUsers.size;
  const onlineUsers = Array.from(activeUsers.values()).map((v) => ({
    id: v.user.id,
    name: v.user.name,
    email: v.user.email,
    role: v.user.role,
  }));

  // Emit to all connected sockets
  io.emit('presence:update', {
    activeUserCount: count,
    onlineUsers,
  });
}

export function broadcastActivity(activity: ActivityFeedItem) {
  if (!io) return;

  // 1. Admin sees everything -> emit to global feed
  io.to('room:global_feed').emit('activity:new', activity);

  // 2. PM and users in project room see project activities
  io.to(`room:project_${activity.projectId}`).emit('activity:new', activity);

  // 3. Developer assigned to the task sees this activity in personal room
  if (activity.task?.assignedToId) {
    io.to(`user:${activity.task.assignedToId}`).emit('activity:new', activity);
  }
}

export function broadcastTaskUpdate(task: any) {
  if (!io) return;
  // Notify project room
  io.to(`room:project_${task.projectId}`).emit('task:updated', task);
  // Notify global feed listeners (Admin)
  io.to('room:global_feed').emit('task:updated', task);
  // Notify assigned developer
  if (task.assignedToId) {
    io.to(`user:${task.assignedToId}`).emit('task:updated', task);
  }
}

export function broadcastNotification(userId: string, notification: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
}

export function getActiveUserCount(): number {
  return activeUsers.size;
}
