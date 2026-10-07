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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    prisma.user
      .findUnique({
        where: { id: decoded.userId },
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
