import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { sendError } from '../utils/response';

export interface AdminPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: Date;
}

export interface AdminAuthRequest extends Request {
  admin?: AdminPayload;
  user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_ecell_key_2026_innovation';

export async function authenticateAdmin(req: AdminAuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No token provided.', null, 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id?: string;
      adminId?: string;
      userId?: string;
      email?: string;
      role?: string;
    };

    const targetId = decoded.id || decoded.adminId || decoded.userId;

    if (!targetId) {
      return sendError(res, 'Invalid token payload.', null, 401);
    }

    // 1. Try finding in Admin table
    const adminRecord = await prisma.admin.findUnique({
      where: { id: targetId },
    });

    if (adminRecord) {
      if (!adminRecord.isActive) {
        return sendError(res, 'Administrator account has been deactivated.', null, 403);
      }
      req.admin = {
        id: adminRecord.id,
        name: adminRecord.name,
        email: adminRecord.email,
        role: adminRecord.role,
        createdAt: adminRecord.createdAt,
      };
      req.user = {
        id: adminRecord.id,
        email: adminRecord.email,
        role: adminRecord.role,
        profile: {
          fullName: adminRecord.name,
        },
      };
      return next();
    }

    // 2. Fallback to User table where role is ADMIN or COORDINATOR
    const userRecord = await prisma.user.findUnique({
      where: { id: targetId },
      include: {
        profile: true,
      },
    });

    if (userRecord) {
      if (userRecord.role !== 'ADMIN' && userRecord.role !== 'COORDINATOR') {
        return sendError(
          res,
          'Access denied: Account lacks institutional administrator privileges.',
          null,
          403
        );
      }

      req.admin = {
        id: userRecord.id,
        name: userRecord.profile?.fullName || userRecord.email,
        email: userRecord.email,
        role: userRecord.role,
        createdAt: userRecord.createdAt,
      };
      req.user = {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        profile: userRecord.profile,
      };
      return next();
    }

    return sendError(res, 'Administrator not found or session invalid.', null, 401);
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Administrator session expired. Please sign in again.', null, 401);
    }
    return sendError(res, 'Invalid administrator authentication token.', null, 401);
  }
}
