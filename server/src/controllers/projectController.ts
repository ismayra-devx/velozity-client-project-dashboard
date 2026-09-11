import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/projectService.js';

export async function getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await projectService.listProjects(req.user!);
    res.status(200).json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user!);
    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.createProject(req.body, req.user!);
    res.status(201).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user!);
    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
}
