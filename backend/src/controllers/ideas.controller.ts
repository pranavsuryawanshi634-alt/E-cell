import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { logAudit, sendNotification } from '../utils/audit';

const ideaSchema = z.object({
  title: z.string().min(3, 'Idea title is required'),
  problem: z.string().min(15, 'Please describe the problem in detail (min 15 chars)'),
  proposedSolution: z.string().min(15, 'Please describe your proposed solution (min 15 chars)'),
  targetUsers: z.string().min(3, 'Specify target users or customer segment'),
  market: z.string().min(3, 'Market opportunity details required'),
  businessModel: z.string().min(3, 'Revenue or business model required'),
  currentStage: z.enum([
    'Ideation',
    'Proof of Concept',
    'Prototype / MVP',
    'Early Traction',
    'Scaling',
  ]),
  teamMembers: z.string().min(2, 'Team members details required'),
  expectedImpact: z.string().min(10, 'Expected impact required'),
  documentUrl: z.string().optional().nullable(),
});

export async function submitIdea(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required to submit a startup idea', null, 401);
    }

    const validated = ideaSchema.parse(req.body);

    const idea = await prisma.startupIdea.create({
      data: {
        ...validated,
        userId: req.user.id,
        status: 'SUBMITTED',
      },
    });

    await sendNotification({
      userId: req.user.id,
      title: 'Startup Idea Submitted 💡',
      message: `"${idea.title}" has been registered with the SIEM Incubation Cell.`,
      type: 'INFO',
      link: '/dashboard/ideas',
    });

    await logAudit({
      userId: req.user.id,
      action: 'STARTUP_IDEA_SUBMITTED',
      entity: 'StartupIdea',
      entityId: idea.id,
      details: `New idea submission: ${idea.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Startup idea submitted successfully!', idea, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Failed to submit idea', null, 500);
  }
}

export async function getMyIdeas(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 'Authentication required', null, 401);

    const ideas = await prisma.startupIdea.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'My startup ideas retrieved', ideas);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch ideas', null, 500);
  }
}

export async function listIdeas(req: AuthRequest, res: Response) {
  try {
    const { status, stage, search } = req.query as Record<string, string>;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }
    if (stage && stage !== 'ALL') {
      where.currentStage = stage;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { problem: { contains: search } },
        { teamMembers: { contains: search } },
        { targetUsers: { contains: search } },
      ];
    }

    const ideas = await prisma.startupIdea.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'Startup ideas retrieved', ideas);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to list ideas', null, 500);
  }
}

export async function getIdeaById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const idea = await prisma.startupIdea.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    if (!idea) return sendError(res, 'Idea not found', null, 404);

    // Only owner or staff can view
    const isStaff = req.user && ['ADMIN', 'COORDINATOR', 'E_CELL_MEMBER'].includes(req.user.role);
    if (!isStaff && idea.userId !== req.user?.id) {
      return sendError(res, 'Access denied', null, 403);
    }

    return sendSuccess(res, 'Idea details retrieved', idea);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch idea', null, 500);
  }
}

export async function reviewIdea(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, adminFeedback, mentorAssigned } = req.body;

    const allowed = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'];
    if (status && !allowed.includes(status)) {
      return sendError(res, 'Invalid idea status', null, 400);
    }

    const idea = await prisma.startupIdea.findUnique({ where: { id } });
    if (!idea) return sendError(res, 'Idea not found', null, 404);

    const updated = await prisma.startupIdea.update({
      where: { id },
      data: {
        status: status || undefined,
        adminFeedback: adminFeedback !== undefined ? adminFeedback : undefined,
        mentorAssigned: mentorAssigned !== undefined ? mentorAssigned : undefined,
      },
    });

    if (status) {
      await sendNotification({
        userId: idea.userId,
        title: `Idea Status Update: ${status}`,
        message: adminFeedback
          ? `Feedback on "${idea.title}": ${adminFeedback}`
          : `Your idea "${idea.title}" status is now ${status.replace('_', ' ')}.`,
        type: ['ACCEPTED', 'SHORTLISTED'].includes(status) ? 'SUCCESS' : 'INFO',
        link: '/dashboard/ideas',
      });
    }

    await logAudit({
      userId: req.user?.id,
      action: 'STARTUP_IDEA_REVIEWED',
      entity: 'StartupIdea',
      entityId: id,
      details: `Updated idea "${idea.title}" status to ${status}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Idea reviewed successfully', updated);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update idea', null, 500);
  }
}

export async function deleteIdea(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const idea = await prisma.startupIdea.findUnique({ where: { id } });
    if (!idea) return sendError(res, 'Idea not found', null, 404);

    if (idea.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      return sendError(res, 'Unauthorized to delete this idea', null, 403);
    }

    await prisma.startupIdea.delete({ where: { id } });

    return sendSuccess(res, 'Idea deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete idea', null, 500);
  }
}
