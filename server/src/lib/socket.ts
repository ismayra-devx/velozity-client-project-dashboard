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

  io.on('connection', (socket: Socket) => {
    const user: AuthUser = socket.data.user;

    // Register active user connection
    if (!activeUsers.has(user.id)) {
      activeUsers.set(user.id, { user, socketIds: new Set([socket.id]) });
    } else {
      activeUsers.get(user.id)!.socketIds.add(socket.id);
    }

    // Join personal user room for direct notifications
    socket.join(`user:${user.id}`);

    // Admins automatically join the global feed room
    if (user.role === 'ADMIN') {
      socket.join('room:global_feed');
    }

    // Broadcast presence update (active user count & active users list)
    broadcastPresence();

    // Client can subscribe to specific project updates
    socket.on('project:join', (projectId: string) => {
      socket.join(`room:project_${projectId}`);
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
