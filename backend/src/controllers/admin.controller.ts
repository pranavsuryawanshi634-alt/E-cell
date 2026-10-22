import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AdminAuthRequest } from '../middleware/adminAuth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_ecell_key_2026_innovation';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/admin/login
 * Authenticates an administrator against the Admin table (or User table with ADMIN/COORDINATOR role)
 */
export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check dedicated Admin model
    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (admin) {
      if (!admin.isActive) {
        return sendError(res, 'Administrator account has been deactivated.', null, 403);
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return sendError(res, 'Invalid administrator email or password.', null, 401);
      }

      const token = jwt.sign(
        {
          id: admin.id,
          adminId: admin.id,
          email: admin.email,
          role: admin.role,
          type: 'ADMIN',
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      return sendSuccess(res, 'Administrator authenticated successfully.', {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt,
        },
      });
    }

    // 2. Check User table for institutional administrators or coordinators
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (user) {
      if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
        return sendError(
          res,
          'Access Denied: Account lacks institutional administrator privileges. Only authorized staff may enter.',
          null,
          403
        );
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return sendError(res, 'Invalid administrator email or password.', null, 401);
      }

      const token = jwt.sign(
        {
          id: user.id,
          adminId: user.id,
          email: user.email,
          role: user.role,
          type: 'ADMIN',
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      return sendSuccess(res, 'Administrator authenticated successfully.', {
        token,
        admin: {
          id: user.id,
          name: user.profile?.fullName || user.email,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    }

    return sendError(res, 'Invalid administrator email or password.', null, 401);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Authentication failed', null, 500);
  }
}

/**
 * POST /api/admin/logout
 * Logs out the administrator
 */
export async function adminLogout(req: AdminAuthRequest, res: Response) {
  try {
    return sendSuccess(res, 'Administrator logged out successfully.', null);
  } catch (error: any) {
    return sendError(res, error.message || 'Logout failed', null, 500);
  }
}

/**
 * GET /api/admin/me
 * Returns authenticated administrator details
 */
export async function getAdminMe(req: AdminAuthRequest, res: Response) {
  try {
    if (!req.admin) {
      return sendError(res, 'Not authenticated as administrator.', null, 401);
    }

    return sendSuccess(res, 'Administrator profile retrieved successfully.', {
      admin: req.admin,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to retrieve administrator profile', null, 500);
  }
}
