import { Request, Response, NextFunction } from 'express';
import * as activityService from '../services/activityService.js';

export async function getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const projectId = req.query.projectId as string | undefined;

    const activities = await activityService.getActivities(req.user!, limit, projectId);
    res.status(200).json({
      success: true,
      data: { activities },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMissed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const activities = await activityService.getMissedActivities(req.user!, limit);

    res.status(200).json({
      success: true,
      data: { activities },
    });
  } catch (error) {
    next(error);
  }
}
