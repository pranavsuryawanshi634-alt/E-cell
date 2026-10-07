import prisma from '../config/db';

export async function logAudit(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Audit log creation failed:', error);
  }
}

export async function sendNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'INFO',
        link: params.link,
      },
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
