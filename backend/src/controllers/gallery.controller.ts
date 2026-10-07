import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const gallerySchema = z.object({
  title: z.string().min(2, 'Title is required'),
  category: z.string().min(2, 'Category is required'),
  imageUrl: z.string().url('Valid image URL is required'),
  description: z.string().optional().nullable(),
  date: z.string().or(z.date()).optional().nullable(),
});

export async function listGallery(req: Request, res: Response) {
  try {
    const { category } = req.query as Record<string, string>;

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const items = await prisma.galleryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'Gallery items retrieved', items);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to list gallery items', null, 500);
  }
}

export async function createGalleryItem(req: AuthRequest, res: Response) {
  try {
    const validated = gallerySchema.parse(req.body);

    const item = await prisma.galleryItem.create({
      data: {
        ...validated,
        date: validated.date ? new Date(validated.date) : null,
      },
    });

    return sendSuccess(res, 'Photo added to gallery', item, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Failed to add gallery item', null, 500);
  }
}

export async function deleteGalleryItem(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.galleryItem.delete({ where: { id } });
    return sendSuccess(res, 'Gallery item deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete gallery item', null, 500);
  }
}
