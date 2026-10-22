import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const blogSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  excerpt: z.string().min(10, 'Excerpt is required'),
  content: z.string().min(20, 'Content is required'),
  category: z.string().min(2, 'Category is required'),
  tags: z.string().default(''),
  coverImageUrl: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});

function generateSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') +
    '-' +
    Math.random().toString(36).substring(2, 6)
  );
}

export async function listBlogs(req: Request, res: Response) {
  try {
    const {
      category,
      tag,
      search,
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = { isPublished: true };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (tag) {
      where.tags = { contains: tag, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take,
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return sendSuccess(res, 'Blogs retrieved', {
      blogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to list blogs', null, 500);
  }
}

export async function getBlogBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const blog = await prisma.blogPost.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
    });

    if (!blog) return sendError(res, 'Article not found', null, 404);

    // Increment view count asynchronously
    await prisma.blogPost.update({
      where: { id: blog.id },
      data: { views: { increment: 1 } },
    });

    return sendSuccess(res, 'Blog post retrieved', blog);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch blog post', null, 500);
  }
}

export async function createBlog(req: AuthRequest, res: Response) {
  try {
    const validated = blogSchema.parse(req.body);
    const slug = generateSlug(validated.title);

    const blog = await prisma.blogPost.create({
      data: {
        ...validated,
        slug,
        authorId: req.user?.id,
        authorName: req.user?.profile?.fullName || 'SIEM E-Cell Editorial',
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'BLOG_CREATED',
      entity: 'BlogPost',
      entityId: blog.id,
      details: `Created blog: ${blog.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Blog created successfully', blog, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Failed to create blog', null, 500);
  }
}

export async function updateBlog(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const validated = blogSchema.partial().parse(req.body);

    const updated = await prisma.blogPost.update({
      where: { id },
      data: validated,
    });

    return sendSuccess(res, 'Blog updated successfully', updated);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update blog', null, 500);
  }
}

export async function deleteBlog(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.blogPost.delete({ where: { id } });

    await logAudit({
      userId: req.user?.id,
      action: 'BLOG_DELETED',
      entity: 'BlogPost',
      entityId: id,
      details: `Deleted blog ID ${id}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Blog deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete blog', null, 500);
  }
}
