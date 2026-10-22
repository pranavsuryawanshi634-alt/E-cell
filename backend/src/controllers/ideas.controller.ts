import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { logAudit, sendNotification } from '../utils/audit';

const ideaSchema = z.object({
  title: z
    .string({ required_error: 'Startup / Project title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters'),
  category: z.string().trim().optional().default('AI & DeepTech'),
  problem: z
    .string({ required_error: 'Problem statement is required' })
    .trim()
    .min(10, 'Please describe the problem in detail (at least 10 characters)'),
  proposedSolution: z
    .string({ required_error: 'Proposed solution is required' })
    .trim()
    .min(10, 'Please describe your proposed solution (at least 10 characters)'),
  targetUsers: z
    .string({ required_error: 'Target users / audience is required' })
    .trim()
    .min(2, 'Please specify your target users or customer segment'),
  market: z
    .string({ required_error: 'Market opportunity / competitors is required' })
    .trim()
    .min(2, 'Please describe the market opportunity or competitors'),
  businessModel: z
    .string({ required_error: 'Revenue / Business model is required' })
    .trim()
    .min(2, 'Please specify your revenue or monetization model'),
  currentStage: z
    .enum([
      'Ideation',
      'Proof of Concept',
      'Prototype / MVP',
      'Early Traction',
      'Scaling',
    ])
    .default('Ideation'),
  teamMembers: z
    .string({ required_error: 'Team members information is required' })
    .trim()
    .min(2, 'Please specify team members or indicate Solo Founder'),
  expectedImpact: z
    .string({ required_error: 'Expected impact / outcome is required' })
    .trim()
    .min(5, 'Please describe the expected impact or key milestones'),
  documentUrl: z.string().trim().optional().nullable(),
});

export async function submitIdea(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required to submit a startup idea', null, 401);
    }

    // Support flexible property names from frontend
    const rawData = {
      title: req.body.title,
      category: req.body.category || 'AI & DeepTech',
      problem: req.body.problem || req.body.problemStatement,
      proposedSolution: req.body.proposedSolution || req.body.solution,
      targetUsers: req.body.targetUsers || req.body.targetAudience,
      market: req.body.market || req.body.marketOpportunity,
      businessModel: req.body.businessModel || req.body.revenueModel,
      currentStage: req.body.currentStage || 'Ideation',
      teamMembers: req.body.teamMembers || req.body.team,
      expectedImpact: req.body.expectedImpact || req.body.impact,
      documentUrl: req.body.documentUrl || req.body.pitchDeckUrl || null,
    };

    const validated = ideaSchema.parse(rawData);

    const idea = await prisma.startupIdea.create({
      data: {
        userId: req.user.id,
        title: validated.title,
        category: validated.category,
        problem: validated.problem,
        proposedSolution: validated.proposedSolution,
        targetUsers: validated.targetUsers,
        market: validated.market,
        businessModel: validated.businessModel,
        currentStage: validated.currentStage,
        teamMembers: validated.teamMembers,
        expectedImpact: validated.expectedImpact,
        documentUrl: validated.documentUrl || null,
        status: 'SUBMITTED',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profile: true,
          },
        },
      },
    });

    await sendNotification({
      userId: req.user.id,
      title: 'Startup Idea Submitted 💡',
      message: `"${idea.title}" has been registered with the SITRC Incubation Cell.`,
      type: 'INFO',
      link: '/ideas',
    });

    await logAudit({
      userId: req.user.id,
      action: 'STARTUP_IDEA_SUBMITTED',
      entity: 'StartupIdea',
      entityId: idea.id,
      details: `New idea submission: ${idea.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Startup idea submitted successfully to E-Cell Review Committee!', idea, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        fieldErrors[field] = err.message;
      });
      const firstMessage = error.errors[0]?.message || 'Please complete all required fields';
      return sendError(res, firstMessage, fieldErrors, 422);
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
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profile: true,
          },
        },
      },
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
