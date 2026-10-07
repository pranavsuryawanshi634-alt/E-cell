import { Response } from 'express';

export function sendSuccess<T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data !== undefined ? data : null,
  });
}

export function sendError(
  res: Response,
  message: string,
  error?: any,
  statusCode = 400
) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error || null,
  });
}
