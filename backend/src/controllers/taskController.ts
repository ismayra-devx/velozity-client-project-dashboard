import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/taskService.js';
import { TaskStatus } from '@prisma/client';

export async function getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tasks = await taskService.listTasks(req.user!, req.query as any);
    res.status(200).json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user!);
    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.createTask(req.body, req.user!);
    res.status(201).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.updateTaskStatus(
      req.params.id,
      req.body.status as TaskStatus,
      req.user!
    );
    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user!);
    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}
