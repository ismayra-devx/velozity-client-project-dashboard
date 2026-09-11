import { z } from 'zod';

export const createTaskSchema = z.object({
  projectId: z.string().uuid('Valid project ID is required'),
  title: z.string().min(2, 'Task title must be at least 2 characters'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid ISO date string is required for due date',
  }),
  assignedToId: z.string().uuid('Valid developer ID is required'),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid ISO date string is required',
  }).optional(),
  assignedToId: z.string().uuid().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
});

export const taskQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
