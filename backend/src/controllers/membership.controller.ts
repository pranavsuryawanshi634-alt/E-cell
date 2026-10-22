import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { logAudit, sendNotification } from '../utils/audit';

const applicationSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  department: z.string().min(2, 'Department is required'),
  year: z.string().min(1, 'Year of study is required'),
  skills: z.string().min(2, 'Please list your key skills'),
  areasOfInterest: z.string().min(2, 'Please specify your areas of interest'),
  whyJoin: z.string().min(15, 'Please provide reasons for joining (min 15 characters)'),
  previousExperience: z.string().optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
});

export async function submitApplication(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required to apply for membership', null, 401);
    }

    const validated = applicationSchema.parse(req.body);

    const existing = await prisma.membershipApplication.findUnique({
      where: { userId: req.user.id },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        return sendError(res, 'You already have a pending membership application under review', null, 400);
      }
      if (existing.status === 'APPROVED') {
        return sendError(res, 'You are already an approved E-Cell member!', null, 400);
      }
    }

    const application = await prisma.membershipApplication.upsert({
      where: { userId: req.user.id },
      update: {
        ...validated,
        status: 'PENDING',
        adminFeedback: null,
      },
      create: {
        ...validated,
        userId: req.user.id,
      },
    });

    await sendNotification({
      userId: req.user.id,
      title: 'Membership Application Submitted 📋',
      message: 'Your application to join the E-Cell team has been received and is under review by coordinators.',
      type: 'INFO',
      link: '/dashboard/applications',
    });

    await logAudit({
      userId: req.user.id,
      action: 'MEMBERSHIP_APPLIED',
      entity: 'MembershipApplication',
      entityId: application.id,
      details: `Membership application submitted by ${validated.fullName}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Membership application submitted successfully!', application, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Failed to submit application', null, 500);
  }
}

export async function getMyApplication(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 'Authentication required', null, 401);

    const application = await prisma.membershipApplication.findUnique({
      where: { userId: req.user.id },
    });

    return sendSuccess(res, 'Application retrieved', application);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch application', null, 500);
  }
}

export async function listApplications(req: AuthRequest, res: Response) {
  try {
    const { status, search } = req.query as Record<string, string>;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { skills: { contains: search, mode: 'insensitive' } },
        { areasOfInterest: { contains: search, mode: 'insensitive' } },
      ];
    }

    const applications = await prisma.membershipApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'Applications retrieved', applications);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to list applications', null, 500);
  }
}

export async function reviewApplication(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, adminFeedback, elevateRole } = req.body;

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return sendError(res, 'Invalid application status', null, 400);
    }

    const application = await prisma.membershipApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) return sendError(res, 'Application not found', null, 404);

    const updated = await prisma.membershipApplication.update({
      where: { id },
      data: {
        status,
        adminFeedback: adminFeedback || null,
        reviewedBy: req.user?.id,
        reviewedAt: new Date(),
      },
    });

    // If approved and elevateRole is true (or by default for approved students)
    if (status === 'APPROVED' && application.user.role === 'STUDENT' && elevateRole !== false) {
      await prisma.user.update({
        where: { id: application.userId },
        data: { role: 'E_CELL_MEMBER' },
      });
    }

    // Send notification to user
    await sendNotification({
      userId: application.userId,
      title:
        status === 'APPROVED'
          ? 'Congratulations! Membership Application Approved! 🎉'
          : status === 'REJECTED'
          ? 'Membership Application Update'
          : 'Membership Application Status Changed',
      message:
        adminFeedback ||
        (status === 'APPROVED'
          ? 'You are now officially a part of the SIEM E-Cell team! Check your dashboard for member tools.'
          : 'Your application status has been updated.'),
      type: status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'WARNING' : 'INFO',
      link: '/dashboard/applications',
    });

    await logAudit({
      userId: req.user?.id,
      action: `MEMBERSHIP_${status}`,
      entity: 'MembershipApplication',
      entityId: id,
      details: `Application for ${application.fullName} marked as ${status}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, `Application marked as ${status}`, updated);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to review application', null, 500);
  }
}
