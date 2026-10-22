import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  eventType: z.enum([
    'WORKSHOP',
    'SEMINAR',
    'HACKATHON',
    'COMPETITION',
    'STARTUP_PITCH',
    'NETWORKING',
    'GUEST_LECTURE',
    'BOOTCAMP',
  ]),
  date: z.string().or(z.date()),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(2, 'Venue is required'),
  organizer: z.string().default('SIEM E-CELL'),
  registrationDeadline: z.string().or(z.date()),
  maxParticipants: z.number().int().min(1).default(100),
  bannerUrl: z.string().optional().nullable(),
  speakerName: z.string().optional().nullable(),
  speakerBio: z.string().optional().nullable(),
  rules: z.string().optional().nullable(),
  eligibility: z.string().optional().nullable(),
  status: z
    .enum([
      'DRAFT',
      'PUBLISHED',
      'REGISTRATION_OPEN',
      'REGISTRATION_CLOSED',
      'COMPLETED',
      'CANCELLED',
    ])
    .default('REGISTRATION_OPEN'),
  isFeatured: z.boolean().default(false),
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

export async function listEvents(req: AuthRequest, res: Response) {
  try {
    const {
      type,
      status,
      featured,
      search,
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    if (type && type !== 'ALL') {
      where.eventType = type.toUpperCase();
    }

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { speakerName: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Unless admin/coordinator, do not show DRAFT events
    const isStaff = req.user && ['ADMIN', 'COORDINATOR', 'E_CELL_MEMBER'].includes(req.user.role);
    if (!isStaff && !where.status) {
      where.status = { not: 'DRAFT' };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        orderBy: [{ isFeatured: 'desc' }, { date: 'asc' }],
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    const formattedEvents = events.map((event) => {
      const now = new Date();
      const isPastDeadline = new Date(event.registrationDeadline) < now;
      const isFull = event._count.registrations >= event.maxParticipants;
      const spotsLeft = Math.max(0, event.maxParticipants - event._count.registrations);

      return {
        ...event,
        registrationsCount: event._count.registrations,
        spotsLeft,
        isFull,
        isPastDeadline,
        canRegister:
          event.status === 'REGISTRATION_OPEN' && !isPastDeadline && !isFull,
      };
    });

    return sendSuccess(res, 'Events retrieved', {
      events: formattedEvents,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to list events', null, 500);
  }
}

export async function getEvent(req: AuthRequest, res: Response) {
  try {
    const { idOrSlug } = req.params;

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return sendError(res, 'Event not found', null, 404);
    }

    // Check if the current logged-in user is registered
    let userRegistration = null;
    if (req.user) {
      userRegistration = await prisma.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: req.user.id,
          },
        },
      });
    }

    const now = new Date();
    const isPastDeadline = new Date(event.registrationDeadline) < now;
    const isFull = event._count.registrations >= event.maxParticipants;
    const spotsLeft = Math.max(0, event.maxParticipants - event._count.registrations);

    return sendSuccess(res, 'Event details retrieved', {
      ...event,
      registrationsCount: event._count.registrations,
      spotsLeft,
      isFull,
      isPastDeadline,
      canRegister:
        event.status === 'REGISTRATION_OPEN' && !isPastDeadline && !isFull && !userRegistration,
      isRegistered: !!userRegistration,
      registration: userRegistration,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch event', null, 500);
  }
}

export async function createEvent(req: AuthRequest, res: Response) {
  try {
    const validated = eventSchema.parse(req.body);
    const slug = generateSlug(validated.title);

    const event = await prisma.event.create({
      data: {
        ...validated,
        slug,
        date: new Date(validated.date),
        registrationDeadline: new Date(validated.registrationDeadline),
        createdById: req.user?.id,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'EVENT_CREATED',
      entity: 'Event',
      entityId: event.id,
      details: `Created event: ${event.title} (${event.eventType})`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Event created successfully', event, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Failed to create event', null, 500);
  }
}

export async function updateEvent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const validated = eventSchema.partial().parse(req.body);

    const updateData: any = { ...validated };
    if (validated.date) updateData.date = new Date(validated.date);
    if (validated.registrationDeadline)
      updateData.registrationDeadline = new Date(validated.registrationDeadline);

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: req.user?.id,
      action: 'EVENT_UPDATED',
      entity: 'Event',
      entityId: updated.id,
      details: `Updated event: ${updated.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Event updated successfully', updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Validation error', error.errors, 422);
    }
    return sendError(res, error.message || 'Failed to update event', null, 500);
  }
}

export async function deleteEvent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return sendError(res, 'Event not found', null, 404);

    await prisma.event.delete({ where: { id } });

    await logAudit({
      userId: req.user?.id,
      action: 'EVENT_DELETED',
      entity: 'Event',
      entityId: id,
      details: `Deleted event: ${event.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Event deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete event', null, 500);
  }
}
