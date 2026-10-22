import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { sendError } from '../utils/response';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  profile?: {
    fullName: string;
    department?: string | null;
    year?: string | null;
    college?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_ecell_key_2026_innovation';

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No token provided.', null, 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      adminId?: string;
      email?: string;
      role?: string;
    };

    const targetId = decoded.userId || decoded.adminId || decoded.id;

    if (!targetId) {
      return sendError(res, 'Invalid token payload.', null, 401);
    }

    // 1. Try finding in Admin table
    const admin = await prisma.admin.findUnique({
      where: { id: targetId },
    });

    if (admin) {
      if (!admin.isActive) {
        return sendError(res, 'Administrator account has been deactivated.', null, 403);
      }
      req.user = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        profile: {
          fullName: admin.name,
          department: 'E-Cell Administrative Control Center',
          college: 'Sandip Institute of Technology and Research Centre',
          year: null,
          avatarUrl: null,
        },
      };
      return next();
    }

    // 2. Fallback to User table
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      include: {
        profile: {
          select: {
            fullName: true,
            department: true,
            year: true,
            college: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 'Invalid token. User not found.', null, 401);
    }

    if (user.status && user.status !== 'ACTIVE') {
      return sendError(res, 'User account is inactive or suspended.', null, 403);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', null, 401);
    }
    return sendError(res, 'Invalid authentication token.', null, 401);
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      adminId?: string;
    };
    const targetId = decoded.userId || decoded.adminId || decoded.id;
    if (!targetId) return next();

    prisma.admin
      .findUnique({ where: { id: targetId } })
      .then((admin) => {
        if (admin && admin.isActive) {
          req.user = {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            profile: {
              fullName: admin.name,
              department: 'E-Cell Administrative Control Center',
              college: 'Sandip Institute of Technology and Research Centre',
              year: null,
              avatarUrl: null,
            },
          };
          return next();
        }

        return prisma.user
          .findUnique({
            where: { id: targetId },
            include: {
              profile: {
                select: {
                  fullName: true,
                  department: true,
                  year: true,
                  college: true,
                  avatarUrl: true,
                },
              },
            },
          })
          .then((user) => {
            if (user) {
              req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                profile: user.profile,
              };
            }
            next();
          })
          .catch(() => next());
      })
      .catch(() => next());
  } catch {
    next();
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', null, 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of [${allowedRoles.join(', ')}] role.`,
        null,
        403
      );
    }

    next();
  };
}
