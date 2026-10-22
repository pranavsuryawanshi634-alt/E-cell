import { Response } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { logAudit, sendNotification } from '../utils/audit';

function generateTicketCode(prefix = 'EC') {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-2026-${rand}`;
}

export async function registerForEvent(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required to register for events', null, 401);
    }

    const { eventId } = req.body;
    const targetEventId = eventId || req.params.id;

    if (!targetEventId) {
      return sendError(res, 'Event ID is required', null, 400);
    }

    const event = await prisma.event.findUnique({
      where: { id: targetEventId },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return sendError(res, 'Event not found', null, 404);
    }

    // 1. Check if event is open for registration
    if (event.status !== 'REGISTRATION_OPEN') {
      return sendError(res, `Registration is currently ${event.status.toLowerCase().replace('_', ' ')}`, null, 400);
    }

    // 2. Check registration deadline
    if (new Date(event.registrationDeadline) < new Date()) {
      return sendError(res, 'Registration deadline for this event has passed', null, 400);
    }

    // 3. Check duplicate registration
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: req.user.id,
        },
      },
    });

    if (existing) {
      return sendError(res, 'You are already registered for this event', null, 409);
    }

    // 4. Check capacity / waitlist
    const isFull = event._count.registrations >= event.maxParticipants;
    const status = isFull ? 'WAITLISTED' : 'CONFIRMED';
    const ticketCode = generateTicketCode(isFull ? 'WAIT' : 'EC');

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        userId: req.user.id,
        status,
        ticketCode,
        notes: req.body.notes || null,
      },
      include: {
        event: {
          select: {
            title: true,
            date: true,
            venue: true,
            startTime: true,
          },
        },
      },
    });

    // Update event counter
    await prisma.event.update({
      where: { id: event.id },
      data: { currentParticipants: { increment: 1 } },
    });

    // Send confirmation notification
    await sendNotification({
      userId: req.user.id,
      title: isFull ? 'Waitlisted for Event' : 'Event Registration Confirmed! 🎟️',
      message: isFull
        ? `You are on the waitlist for "${event.title}". We'll notify you if seats open up.`
        : `You are confirmed for "${event.title}". Your Ticket Code is ${ticketCode}.`,
      type: 'EVENT',
      link: '/dashboard/events',
    });

    await logAudit({
      userId: req.user.id,
      action: 'EVENT_REGISTERED',
      entity: 'EventRegistration',
      entityId: registration.id,
      details: `User registered for ${event.title} (Ticket: ${ticketCode}, Status: ${status})`,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      isFull
        ? 'Event is full! You have been placed on the waitlist.'
        : 'Registration successful! Your ticket has been generated.',
      registration,
      201
    );
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to complete registration', null, 500);
  }
}

export async function getEventRegistrations(req: AuthRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const { status, search } = req.query as Record<string, string>;

    const where: any = { eventId };

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { ticketCode: { contains: search, mode: 'insensitive' } },
        { user: { profile: { fullName: { contains: search, mode: 'insensitive' } } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const registrations = await prisma.eventRegistration.findMany({
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

    return sendSuccess(res, 'Registrations retrieved', registrations);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch registrations', null, 500);
  }
}

export async function getAllRegistrations(req: AuthRequest, res: Response) {
  try {
    const { status, search, eventId } = req.query as Record<string, string>;

    const where: any = {};

    if (eventId && eventId !== 'ALL') {
      where.eventId = eventId;
    }

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { ticketCode: { contains: search, mode: 'insensitive' } },
        { user: { profile: { fullName: { contains: search, mode: 'insensitive' } } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { event: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const registrations = await prisma.eventRegistration.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            venue: true,
            eventType: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return sendSuccess(res, 'All registrations retrieved', registrations);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch registrations', null, 500);
  }
}


export async function getMyRegistrations(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', null, 401);
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { userId: req.user.id },
      include: {
        event: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'My registrations retrieved', registrations);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch registrations', null, 500);
  }
}

export async function updateRegistrationStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['CONFIRMED', 'WAITLISTED', 'ATTENDED', 'CANCELLED'].includes(status)) {
      return sendError(res, 'Invalid registration status', null, 400);
    }

    const updated = await prisma.eventRegistration.update({
      where: { id },
      data: { status },
      include: {
        event: { select: { title: true } },
      },
    });

    return sendSuccess(res, 'Registration status updated', updated);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update status', null, 500);
  }
}

export async function cancelMyRegistration(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 'Authentication required', null, 401);
    const { id } = req.params;

    const reg = await prisma.eventRegistration.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!reg) return sendError(res, 'Registration not found', null, 404);

    if (reg.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'Unauthorized to cancel this registration', null, 403);
    }

    await prisma.eventRegistration.delete({ where: { id } });

    // Decrement counter
    await prisma.event.update({
      where: { id: reg.eventId },
      data: { currentParticipants: { decrement: 1 } },
    });

    return sendSuccess(res, 'Registration cancelled successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to cancel registration', null, 500);
  }
}

export async function exportRegistrationsCsv(req: AuthRequest, res: Response) {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return sendError(res, 'Event not found', null, 404);

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const csvHeaders = 'Ticket Code,Full Name,Email,Phone,Department,Year,Division,College,Status,Registered At\n';
    const csvRows = registrations
      .map((r) => {
        const p = r.user.profile;
        return [
          r.ticketCode,
          `"${p?.fullName || ''}"`,
          r.user.email,
          `"${p?.phone || ''}"`,
          `"${p?.department || ''}"`,
          `"${p?.year || ''}"`,
          `"${p?.division || ''}"`,
          `"${p?.college || ''}"`,
          r.status,
          new Date(r.createdAt).toISOString(),
        ].join(',');
      })
      .join('\n');

    const csvData = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="participants-${event.slug}.csv"`
    );
    return res.status(200).send(csvData);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to export CSV', null, 500);
  }
}
