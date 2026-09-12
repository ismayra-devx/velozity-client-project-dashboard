import { Request, Response, NextFunction } from 'express';
import * as clientService from '../services/clientService.js';

export async function getClients(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const clients = await clientService.listClients();
    res.status(200).json({
      success: true,
      data: { clients },
    });
  } catch (error) {
    next(error);
  }
}

export async function createClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = await clientService.createClient(req.body);
    res.status(201).json({
      success: true,
      data: { client },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDevelopers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const developers = await clientService.listDevelopers();
    res.status(200).json({
      success: true,
      data: { developers },
    });
  } catch (error) {
    next(error);
  }
}
