import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const teamMemberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  role: z.string().min(2, 'Role/designation is required'),
  category: z.string().min(2, 'Category is required'),
  department: z.string().optional().nullable(),
  year: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function listTeam(req: Request, res: Response) {
  try {
    const { category } = req.query as Record<string, string>;

    const where: any = { isActive: true };
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const team = await prisma.teamMember.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    return sendSuccess(res, 'Team members retrieved', team);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to list team members', null, 500);
  }
}

export async function createTeamMember(req: AuthRequest, res: Response) {
  try {
    const validated = teamMemberSchema.parse(req.body);

    const member = await prisma.teamMember.create({
      data: validated,
    });

    await logAudit({
      userId: req.user?.id,
      action: 'TEAM_MEMBER_ADDED',
      entity: 'TeamMember',
      entityId: member.id,
      details: `Added team member: ${member.name} (${member.role})`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Team member added successfully', member, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Failed to add team member', null, 500);
  }
}

export async function updateTeamMember(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const validated = teamMemberSchema.partial().parse(req.body);

    const updated = await prisma.teamMember.update({
      where: { id },
      data: validated,
    });

    return sendSuccess(res, 'Team member updated successfully', updated);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update team member', null, 500);
  }
}

export async function deleteTeamMember(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.teamMember.delete({ where: { id } });

    await logAudit({
      userId: req.user?.id,
      action: 'TEAM_MEMBER_REMOVED',
      entity: 'TeamMember',
      entityId: id,
      details: `Removed team member ID ${id}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Team member deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete team member', null, 500);
  }
}
