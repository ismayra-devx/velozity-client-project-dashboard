import { prisma } from '../lib/prisma.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import { AuthUser } from '../types/index.js';

export async function getUserNotifications(user: AuthUser, limit = 30) {
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
    },
  });

  return { notifications, unreadCount };
}

export async function markNotificationAsRead(notificationId: string, user: AuthUser) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.userId !== user.id) {
    throw new AppError('Forbidden: Access denied to notification', 403);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(user: AuthUser) {
  return prisma.notification.updateMany({
    where: {
      userId: user.id,
      isRead: false,
    },
    data: { isRead: true },
  });
}
