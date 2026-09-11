import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { broadcastActivity, broadcastTaskUpdate, broadcastNotification } from '../lib/socket.js';

export function startOverdueTaskScheduler() {
  // Run every minute to check for newly overdue tasks
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find tasks that have crossed their due date, are not marked DONE, and not yet flagged
      const overdueTasks = await prisma.task.findMany({
        where: {
          isOverdue: false,
          status: { not: 'DONE' },
          dueDate: { lt: now },
        },
        include: {
          project: { select: { id: true, name: true, createdById: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      });

      if (overdueTasks.length === 0) {
        return;
      }

      console.log(`[Scheduler] Detected ${overdueTasks.length} newly overdue task(s). Updating...`);

      for (const task of overdueTasks) {
        // Update task isOverdue status
        const updatedTask = await prisma.task.update({
          where: { id: task.id },
          data: { isOverdue: true },
          include: {
            project: { select: { id: true, name: true, createdById: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        });

        // Find a system or admin user or creator to attribute system log
        const creatorId = task.project.createdById;

        const formattedMessage = `System flagged Task #${task.taskNumber} ("${task.title}") as Overdue`;

        const activity = await prisma.taskActivityLog.create({
          data: {
            taskId: task.id,
            projectId: task.projectId,
            userId: creatorId,
            action: 'OVERDUE_FLAGGED',
            fromStatus: task.status,
            toStatus: task.status,
            message: formattedMessage,
          },
          include: {
            user: { select: { id: true, name: true, role: true } },
            task: { select: { id: true, taskNumber: true, title: true, assignedToId: true } },
            project: { select: { id: true, name: true } },
          },
        });

        // Send notifications to developer and project manager
        const devNotification = await prisma.notification.create({
          data: {
            userId: task.assignedToId,
            taskId: task.id,
            title: 'Task Overdue',
            message: `Task #${task.taskNumber} ("${task.title}") is past due date!`,
          },
        });
        broadcastNotification(task.assignedToId, devNotification);

        if (creatorId && creatorId !== task.assignedToId) {
          const pmNotification = await prisma.notification.create({
            data: {
              userId: creatorId,
              taskId: task.id,
              title: 'Task Overdue',
              message: `Task #${task.taskNumber} ("${task.title}") in ${task.project.name} is now overdue`,
            },
          });
          broadcastNotification(creatorId, pmNotification);
        }

        // Broadcast real-time updates
        broadcastActivity(activity);
        broadcastTaskUpdate(updatedTask);
      }
    } catch (error) {
      console.error('[Scheduler Error] Failed checking overdue tasks:', error);
    }
  });

  console.log('[Scheduler] Overdue task background cron job initialized (interval: 1 minute).');
}
