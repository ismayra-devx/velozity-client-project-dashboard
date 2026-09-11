import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await dashboardService.getDashboardData(req.user!);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
