import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { logAudit, sendNotification } from '../utils/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_ecell_key_2026_innovation';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full Name must be at least 2 characters'),
    email: z.string().email('Please provide a valid email address'),
    phone: z.string().min(10, 'Valid contact number is required'),
    college: z.string().min(2, 'College name is required'),
    department: z.string().min(2, 'Department is required'),
    year: z.string().min(1, 'Year of study is required'),
    division: z.string().min(1, 'Division is required'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response) {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return sendError(res, 'An account with this email already exists', null, 409);
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validated.email.toLowerCase(),
        password: hashedPassword,
        role: 'STUDENT',
        profile: {
          create: {
            fullName: validated.fullName,
            phone: validated.phone,
            college: validated.college,
            department: validated.department,
            year: validated.year,
            division: validated.division,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    await sendNotification({
      userId: user.id,
      title: 'Welcome to SIEM E-Cell! 🚀',
      message: 'Your account has been registered. Explore upcoming workshops, hackathons, and membership calls.',
      type: 'INFO',
      link: '/events',
    });

    await logAudit({
      userId: user.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      details: `New student registration: ${user.email}`,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      'Registration successful! Welcome to E-Cell.',
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
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

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password', null, 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', null, 401);
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    return sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
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
      role: user.role,
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
