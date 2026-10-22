import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { logAudit, sendNotification } from '../utils/audit';
import { authRateLimiter } from '../utils/rateLimiter';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_ecell_key_2026_innovation';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full Name must be at least 2 characters'),
    email: z.string().trim().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string(),
    phone: z.string().optional(),
    college: z.string().optional(),
    department: z.string().optional(),
    year: z.string().optional(),
    division: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response) {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const rateCheck = authRateLimiter.consume(`reg:${clientIp}`, 15, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return sendError(
        res,
        `Too many registration requests. Please try again in ${rateCheck.retryAfterSec} seconds.`,
        null,
        429
      );
    }

    const validated = registerSchema.parse(req.body);
    const normalizedEmail = validated.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return sendError(res, 'An account with this email address already exists. Please sign in instead.', null, 409);
    }

    // Secure password hashing with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const now = new Date();
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        fullName: validated.fullName,
        role: 'STUDENT',
        status: 'ACTIVE',
        lastLoginAt: now,
        profile: {
          create: {
            fullName: validated.fullName,
            phone: validated.phone || null,
            college: validated.college || 'Sandip Institute of Technology and Research Centre',
            department: validated.department || null,
            year: validated.year || null,
            division: validated.division || null,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Record initial registration login activity
    await prisma.userLoginActivity.create({
      data: {
        userId: user.id,
        email: user.email,
        ipAddress: clientIp,
        userAgent: (req.headers['user-agent'] as string) || null,
        status: 'SUCCESS',
      },
    }).catch(() => {});

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    await sendNotification({
      userId: user.id,
      title: 'Welcome to SITRC E-Cell! 🚀',
      message: 'Your account has been registered. Explore upcoming workshops, hackathons, and incubation resources.',
      type: 'INFO',
      link: '/events',
    });

    await logAudit({
      userId: user.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      details: `New student registration: ${user.email} (${validated.fullName})`,
      ipAddress: clientIp,
    });

    return sendSuccess(
      res,
      'Registration successful! Welcome to E-Cell SITRC.',
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName || user.profile?.fullName,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          profile: user.profile,
        },
      },
      201
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Failed to complete registration', null, 500);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';

    const rateKey = `login:${clientIp}:${normalizedEmail}`;
    const rateCheck = authRateLimiter.consume(rateKey, 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return sendError(
        res,
        `Too many failed login attempts. Please wait ${rateCheck.retryAfterSec} seconds before trying again.`,
        null,
        429
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password', null, 401);
    }

    if (user.status && user.status !== 'ACTIVE') {
      return sendError(
        res,
        'Your account has been deactivated or suspended. Please contact administration.',
        null,
        403
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Record failed activity for security audit
      await prisma.userLoginActivity.create({
        data: {
          userId: user.id,
          email: user.email,
          ipAddress: clientIp,
          userAgent: (req.headers['user-agent'] as string) || null,
          status: 'FAILED',
        },
      }).catch(() => {});

      return sendError(res, 'Invalid email or password', null, 401);
    }

    // Reset rate limiter on successful authentication
    authRateLimiter.reset(rateKey);

    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });

    // Record successful login activity
    await prisma.userLoginActivity.create({
      data: {
        userId: user.id,
        email: user.email,
        ipAddress: clientIp,
        userAgent: (req.headers['user-agent'] as string) || null,
        status: 'SUCCESS',
      },
    }).catch(() => {});

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    return sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName || user.profile?.fullName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: now,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Login failed', null, 500);
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Not authenticated', null, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        _count: {
          select: {
            registrations: true,
            startupIdeas: true,
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 'User not found', null, 404);
    }

    const unreadNotificationsCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return sendSuccess(res, 'Profile retrieved', {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.profile?.fullName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile,
      stats: {
        registrationsCount: user._count.registrations,
        ideasCount: user._count.startupIdeas,
        unreadNotificationsCount,
      },
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch user', null, 500);
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Not authenticated', null, 401);
    }

    const {
      fullName,
      phone,
      college,
      department,
      year,
      division,
      avatarUrl,
      bio,
      linkedinUrl,
      githubUrl,
      skills,
    } = req.body;

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      update: {
        fullName: fullName || undefined,
        phone: phone || undefined,
        college: college || undefined,
        department: department || undefined,
        year: year || undefined,
        division: division || undefined,
        avatarUrl: avatarUrl || undefined,
        bio: bio || undefined,
        linkedinUrl: linkedinUrl || undefined,
        githubUrl: githubUrl || undefined,
        skills: skills || undefined,
      },
      create: {
        userId: req.user.id,
        fullName: fullName || 'User',
        phone,
        college,
        department,
        year,
        division,
        avatarUrl,
        bio,
        linkedinUrl,
        githubUrl,
        skills,
      },
    });

    return sendSuccess(res, 'Profile updated successfully', updatedProfile);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update profile', null, 500);
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Not authenticated', null, 401);
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', null, 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) return sendError(res, 'User not found', null, 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, 'Current password does not match', null, 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return sendSuccess(res, 'Password changed successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to change password', null, 500);
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email is required', null, 400);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Don't leak user existence
      return sendSuccess(res, 'If your email is registered, password reset instructions have been sent.');
    }

    // In a production setup, send email token. Here we create a mock reset token
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    return sendSuccess(res, 'Password reset token generated. (Check notification/email)', {
      resetToken: token, // Returned for development convenience
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Forgot password failed', null, 500);
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword || newPassword.length < 6) {
      return sendError(res, 'Valid email, token and new password (min 6 chars) are required', null, 400);
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.resetToken !== resetToken) {
      return sendError(res, 'Invalid or expired reset token', null, 400);
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return sendError(res, 'Reset token has expired', null, 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return sendSuccess(res, 'Password successfully reset. You can now login with your new password.');
  } catch (error: any) {
    return sendError(res, error.message || 'Password reset failed', null, 500);
  }
}
