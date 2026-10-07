import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const announcementSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  content: z.string().min(5, 'Content is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  category: z.string().default('General'),
  attachmentUrl: z.string().optional().nullable(),
  linkUrl: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  expiryDate: z.string().or(z.date()).optional().nullable(),
});

export async function listAnnouncements(req: Request, res: Response) {
  try {
    const { priority, isPublished } = req.query as Record<string, string>;

    const where: any = {};
    if (priority && priority !== 'ALL') {
      where.priority = priority.toUpperCase();
    }
    if (isPublished !== undefined) {
      where.isPublished = isPublished === 'true';
    } else {
      where.isPublished = true;
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { publishDate: 'desc' }],
    });

    return sendSuccess(res, 'Announcements retrieved', announcements);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to list announcements', null, 500);
  }
}

export async function createAnnouncement(req: AuthRequest, res: Response) {
  try {
    const validated = announcementSchema.parse(req.body);

    const announcement = await prisma.announcement.create({
      data: {
        ...validated,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'ANNOUNCEMENT_CREATED',
      entity: 'Announcement',
      entityId: announcement.id,
      details: `Created announcement: ${announcement.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Announcement created successfully', announcement, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Failed to create announcement', null, 500);
  }
}

export async function updateAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const validated = announcementSchema.partial().parse(req.body);

    const updateData: any = { ...validated };
    if (validated.expiryDate) {
      updateData.expiryDate = new Date(validated.expiryDate);
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    return sendSuccess(res, 'Announcement updated successfully', updated);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update announcement', null, 500);
  }
}

export async function deleteAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });

    return sendSuccess(res, 'Announcement deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete announcement', null, 500);
  }
}
