import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';
import { ActivityItem, NotificationItem, Task } from '../types/index.js';
import { apiRequest } from '../services/api.js';

interface PresencePayload {
  activeUserCount: number;
  onlineUsers: { id: string; name: string; email: string; role: string }[];
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeUserCount: number;
  onlineUsers: { id: string; name: string; email: string; role: string }[];
  activities: ActivityItem[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  joinProjectRoom: (projectId: string) => void;
  leaveProjectRoom: (projectId: string) => void;
  refreshActivities: () => Promise<void>;
  latestTaskUpdate: Task | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeUserCount, setActiveUserCount] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [latestTaskUpdate, setLatestTaskUpdate] = useState<Task | null>(null);

  // Fetch initial notifications from DB
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications');
      setNotifications(data.notifications || []);
      setUnreadNotificationCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed loading notifications:', err);
    }
  }, [user]);

  // Offline catchup: fetch missed activities from database (not memory cache)
  const refreshActivities = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiRequest<{ activities: ActivityItem[] }>('/activities/missed?limit=20');
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed loading activity catchup:', err);
    }
  }, [user]);

  // Connect socket when user logs in with token
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Fetch missed activities from DB to catch up
      refreshActivities();
      loadNotifications();
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time live presence listener
    socketInstance.on('presence:update', (payload: PresencePayload) => {
      setActiveUserCount(payload.activeUserCount);
      setOnlineUsers(payload.onlineUsers || []);
    });

    // Real-time activity feed listener
    socketInstance.on('activity:new', (newActivity: ActivityItem) => {
      setActivities((prev) => {
        // Prevent duplicate items
        if (prev.some((a) => a.id === newActivity.id)) return prev;
        return [newActivity, ...prev];
      });
    });

    // Missed event catchup listener (delivered over WebSocket directly from DB on connect/reconnect)
    socketInstance.on('activity:catchup', (catchupActivities: ActivityItem[]) => {
      setActivities((prev) => {
        const map = new Map<string, ActivityItem>();
        [...(catchupActivities || []), ...prev].forEach((item) => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    });

    // Real-time task update listener
    socketInstance.on('task:updated', (task: Task) => {
      setLatestTaskUpdate(task);
    });

    // Real-time notification listener
    socketInstance.on('notification:new', (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadNotificationCount((count) => count + 1);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user, refreshActivities, loadNotifications]);

  const joinProjectRoom = (projectId: string) => {
    if (socket && isConnected) {
      socket.emit('project:join', projectId);
    }
  };

  const leaveProjectRoom = (projectId: string) => {
    if (socket && isConnected) {
      socket.emit('project:leave', projectId);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotificationCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeUserCount,
        onlineUsers,
        activities,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        joinProjectRoom,
        leaveProjectRoom,
        refreshActivities,
        latestTaskUpdate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
