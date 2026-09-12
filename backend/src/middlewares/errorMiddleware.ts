import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = 'statusCode' in err && typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = err.message || 'An unexpected error occurred';

  // Log error internally for debugging
  console.error(`[Error] ${statusCode} - ${message}`);

  // Structured response without raw stack trace to the client
  res.status(statusCode).json({
    success: false,
    message,
  });
}
