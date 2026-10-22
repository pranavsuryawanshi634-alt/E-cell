import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportDatabase() {
  console.log('📦 Starting E-Cell SITRC Database Export...');

  const [
    users,
    profiles,
    startupIdeas,
    events,
    registrations,
    announcements,
    blogs,
    teamMembers,
    membershipApps,
    notifications,
    auditLogs,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.profile.findMany(),
    prisma.startupIdea.findMany(),
    prisma.event.findMany(),
    prisma.eventRegistration.findMany(),
    prisma.announcement.findMany(),
    prisma.blogPost.findMany(),
    prisma.teamMember.findMany(),
    prisma.membershipApplication.findMany(),
    prisma.notification.findMany(),
    prisma.auditLog.findMany(),
  ]);

  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      platform: 'E-Cell SITRC Platform',
      version: '1.0.0',
      totalRecords: {
        users: users.length,
        profiles: profiles.length,
        startupIdeas: startupIdeas.length,
        events: events.length,
        registrations: registrations.length,
        announcements: announcements.length,
        blogs: blogs.length,
        teamMembers: teamMembers.length,
        membershipApplications: membershipApps.length,
        notifications: notifications.length,
        auditLogs: auditLogs.length,
      },
    },
    data: {
      users,
      profiles,
      startupIdeas,
      events,
      registrations,
      announcements,
      blogs,
      teamMembers,
      membershipApplications: membershipApps,
      notifications,
      auditLogs,
    },
  };

  const exportPath = path.join(process.cwd(), 'prisma', 'db-export-latest.json');
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf-8');

  console.log('✅ Database Export Completed Successfully!');
  console.log(`📁 File saved to: ${exportPath}`);
  console.log('📊 Summary:');
  console.table(exportData.metadata.totalRecords);
}

exportDatabase()
  .catch((err) => {
    console.error('❌ Failed to export database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
