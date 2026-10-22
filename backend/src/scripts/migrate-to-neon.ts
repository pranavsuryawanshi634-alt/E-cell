import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

interface MigrationStats {
  model: string;
  sourceCount: number;
  migratedCount: number;
  status: 'MATCH' | 'MISMATCH' | 'FAILED';
  errors: string[];
}

async function main() {
  console.log('\n======================================================');
  console.log('  E-Cell SITRC: SQLite to Neon PostgreSQL Data Migration');
  console.log('======================================================\n');

  const databaseUrl = process.env.DATABASE_URL || '';
  if (!databaseUrl || (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://'))) {
    console.error('❌ ERROR: DATABASE_URL must point to a valid PostgreSQL database (e.g. Neon connection string).');
    console.error('   Current DATABASE_URL does not start with postgresql:// or postgres://');
    console.error('   Please configure your Neon connection string in backend/.env before running this script.');
    process.exit(1);
  }

  // Load the export JSON file
  const exportPath = path.join(process.cwd(), 'prisma', 'db-export-latest.json');
  if (!fs.existsSync(exportPath)) {
    console.error(`❌ ERROR: Export file not found at: ${exportPath}`);
    console.error('   Please run "npm run db:export" first to generate the local database snapshot.');
    process.exit(1);
  }

  console.log(`📂 Reading verified snapshot from: ${exportPath}`);
  const rawData = fs.readFileSync(exportPath, 'utf-8');
  const exportJson = JSON.parse(rawData);
  const data = exportJson.data;

  if (!data) {
    console.error('❌ ERROR: Invalid export format: missing "data" property.');
    process.exit(1);
  }

  console.log('🔌 Connecting to destination PostgreSQL database...');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected successfully to PostgreSQL destination!\n');

    const stats: MigrationStats[] = [];

    // Helper to log and track progress
    async function migrateModel(
      modelName: string,
      records: any[] | undefined,
      migrateFn: (item: any) => Promise<any>,
      countFn: () => Promise<number>
    ) {
      const items = records || [];
      const itemErrors: string[] = [];
      let successCount = 0;

      process.stdout.write(`⏳ Migrating ${modelName.padEnd(24)} (${items.length.toString().padStart(3)} records)... `);

      for (const item of items) {
        try {
          await migrateFn(item);
          successCount++;
        } catch (err: any) {
          itemErrors.push(`ID: ${item.id || item.email || item.certificateNumber || 'unknown'} - ${err.message || err}`);
        }
      }

      const targetCount = await countFn().catch(() => -1);
      const isMatch = targetCount === items.length && itemErrors.length === 0;

      if (isMatch) {
        console.log(`✅ OK (${targetCount} in DB)`);
      } else {
        console.log(`⚠️ MISMATCH (Target: ${targetCount}, Source: ${items.length}, Errors: ${itemErrors.length})`);
      }

      stats.push({
        model: modelName,
        sourceCount: items.length,
        migratedCount: targetCount,
        status: isMatch ? 'MATCH' : 'MISMATCH',
        errors: itemErrors,
      });
    }

    console.log('--- Phase 1: Independent Master Entities ---');

    // 1. Admin
    await migrateModel(
      'Admin',
      data.admins,
      (a) =>
        prisma.admin.upsert({
          where: { email: a.email },
          update: {
            name: a.name,
            password: a.password,
            role: a.role,
            isActive: a.isActive,
          },
          create: {
            id: a.id,
            name: a.name,
            email: a.email,
            password: a.password,
            role: a.role,
            isActive: a.isActive,
            createdAt: new Date(a.createdAt),
            updatedAt: new Date(a.updatedAt),
          },
        }),
      () => prisma.admin.count()
    );

    // 2. User
    await migrateModel(
      'User',
      data.users,
      (u) =>
        prisma.user.upsert({
          where: { id: u.id },
          update: {
            email: u.email,
            password: u.password,
            role: u.role,
            isVerified: u.isVerified,
            fullName: u.fullName,
            status: u.status,
            lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
            resetToken: u.resetToken,
            resetTokenExpiry: u.resetTokenExpiry ? new Date(u.resetTokenExpiry) : null,
          },
          create: {
            id: u.id,
            email: u.email,
            password: u.password,
            role: u.role,
            isVerified: u.isVerified,
            fullName: u.fullName,
            status: u.status,
            lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
            resetToken: u.resetToken,
            resetTokenExpiry: u.resetTokenExpiry ? new Date(u.resetTokenExpiry) : null,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          },
        }),
      () => prisma.user.count()
    );

    // 3. Event
    await migrateModel(
      'Event',
      data.events,
      (e) =>
        prisma.event.upsert({
          where: { id: e.id },
          update: {
            title: e.title,
            slug: e.slug,
            description: e.description,
            eventType: e.eventType,
            date: new Date(e.date),
            startTime: e.startTime,
            endTime: e.endTime,
            venue: e.venue,
            organizer: e.organizer,
            registrationDeadline: new Date(e.registrationDeadline),
            maxParticipants: e.maxParticipants,
            currentParticipants: e.currentParticipants,
            bannerUrl: e.bannerUrl,
            speakerName: e.speakerName,
            speakerBio: e.speakerBio,
            rules: e.rules,
            eligibility: e.eligibility,
            status: e.status,
            isFeatured: e.isFeatured,
            createdById: e.createdById,
          },
          create: {
            id: e.id,
            title: e.title,
            slug: e.slug,
            description: e.description,
            eventType: e.eventType,
            date: new Date(e.date),
            startTime: e.startTime,
            endTime: e.endTime,
            venue: e.venue,
            organizer: e.organizer,
            registrationDeadline: new Date(e.registrationDeadline),
            maxParticipants: e.maxParticipants,
            currentParticipants: e.currentParticipants,
            bannerUrl: e.bannerUrl,
            speakerName: e.speakerName,
            speakerBio: e.speakerBio,
            rules: e.rules,
            eligibility: e.eligibility,
            status: e.status,
            isFeatured: e.isFeatured,
            createdById: e.createdById,
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt),
          },
        }),
      () => prisma.event.count()
    );

    // 4. Announcement
    await migrateModel(
      'Announcement',
      data.announcements,
      (ann) =>
        prisma.announcement.upsert({
          where: { id: ann.id },
          update: {
            title: ann.title,
            content: ann.content,
            priority: ann.priority,
            category: ann.category,
            attachmentUrl: ann.attachmentUrl,
            linkUrl: ann.linkUrl,
            isPublished: ann.isPublished,
            publishDate: new Date(ann.publishDate),
            expiryDate: ann.expiryDate ? new Date(ann.expiryDate) : null,
          },
          create: {
            id: ann.id,
            title: ann.title,
            content: ann.content,
            priority: ann.priority,
            category: ann.category,
            attachmentUrl: ann.attachmentUrl,
            linkUrl: ann.linkUrl,
            isPublished: ann.isPublished,
            publishDate: new Date(ann.publishDate),
            expiryDate: ann.expiryDate ? new Date(ann.expiryDate) : null,
            createdAt: new Date(ann.createdAt),
            updatedAt: new Date(ann.updatedAt),
          },
        }),
      () => prisma.announcement.count()
    );

    // 5. TeamMember
    await migrateModel(
      'TeamMember',
      data.teamMembers,
      (tm) =>
        prisma.teamMember.upsert({
          where: { id: tm.id },
          update: {
            name: tm.name,
            role: tm.role,
            category: tm.category,
            department: tm.department,
            year: tm.year,
            photoUrl: tm.photoUrl,
            bio: tm.bio,
            linkedinUrl: tm.linkedinUrl,
            githubUrl: tm.githubUrl,
            email: tm.email,
            order: tm.order,
            isActive: tm.isActive,
          },
          create: {
            id: tm.id,
            name: tm.name,
            role: tm.role,
            category: tm.category,
            department: tm.department,
            year: tm.year,
            photoUrl: tm.photoUrl,
            bio: tm.bio,
            linkedinUrl: tm.linkedinUrl,
            githubUrl: tm.githubUrl,
            email: tm.email,
            order: tm.order,
            isActive: tm.isActive,
            createdAt: new Date(tm.createdAt),
            updatedAt: new Date(tm.updatedAt),
          },
        }),
      () => prisma.teamMember.count()
    );

    // 6. GalleryItem
    await migrateModel(
      'GalleryItem',
      data.galleryItems,
      (gi) =>
        prisma.galleryItem.upsert({
          where: { id: gi.id },
          update: {
            title: gi.title,
            category: gi.category,
            imageUrl: gi.imageUrl,
            description: gi.description,
            date: gi.date ? new Date(gi.date) : null,
          },
          create: {
            id: gi.id,
            title: gi.title,
            category: gi.category,
            imageUrl: gi.imageUrl,
            description: gi.description,
            date: gi.date ? new Date(gi.date) : null,
            createdAt: new Date(gi.createdAt),
          },
        }),
      () => prisma.galleryItem.count()
    );

    // 7. ContactMessage
    await migrateModel(
      'ContactMessage',
      data.contactMessages,
      (cm) =>
        prisma.contactMessage.upsert({
          where: { id: cm.id },
          update: {
            name: cm.name,
            email: cm.email,
            phone: cm.phone,
            subject: cm.subject,
            message: cm.message,
            status: cm.status,
          },
          create: {
            id: cm.id,
            name: cm.name,
            email: cm.email,
            phone: cm.phone,
            subject: cm.subject,
            message: cm.message,
            status: cm.status,
            createdAt: new Date(cm.createdAt),
          },
        }),
      () => prisma.contactMessage.count()
    );

    // 8. Sponsor
    await migrateModel(
      'Sponsor',
      data.sponsors,
      (sp) =>
        prisma.sponsor.upsert({
          where: { id: sp.id },
          update: {
            name: sp.name,
            logoUrl: sp.logoUrl,
            websiteUrl: sp.websiteUrl,
            tier: sp.tier,
            description: sp.description,
            isActive: sp.isActive,
          },
          create: {
            id: sp.id,
            name: sp.name,
            logoUrl: sp.logoUrl,
            websiteUrl: sp.websiteUrl,
            tier: sp.tier,
            description: sp.description,
            isActive: sp.isActive,
            createdAt: new Date(sp.createdAt),
          },
        }),
      () => prisma.sponsor.count()
    );

    console.log('\n--- Phase 2: Foreign Key Dependent Entities ---');

    // 9. Profile (FK: User)
    await migrateModel(
      'Profile',
      data.profiles,
      (p) =>
        prisma.profile.upsert({
          where: { userId: p.userId },
          update: {
            fullName: p.fullName,
            phone: p.phone,
            college: p.college,
            department: p.department,
            year: p.year,
            division: p.division,
            avatarUrl: p.avatarUrl,
            bio: p.bio,
            linkedinUrl: p.linkedinUrl,
            githubUrl: p.githubUrl,
            skills: p.skills,
          },
          create: {
            id: p.id,
            userId: p.userId,
            fullName: p.fullName,
            phone: p.phone,
            college: p.college,
            department: p.department,
            year: p.year,
            division: p.division,
            avatarUrl: p.avatarUrl,
            bio: p.bio,
            linkedinUrl: p.linkedinUrl,
            githubUrl: p.githubUrl,
            skills: p.skills,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          },
        }),
      () => prisma.profile.count()
    );

    // 10. StartupIdea (FK: User)
    await migrateModel(
      'StartupIdea',
      data.startupIdeas,
      (si) =>
        prisma.startupIdea.upsert({
          where: { id: si.id },
          update: {
            title: si.title,
            category: si.category,
            problem: si.problem,
            proposedSolution: si.proposedSolution,
            targetUsers: si.targetUsers,
            market: si.market,
            businessModel: si.businessModel,
            currentStage: si.currentStage,
            teamMembers: si.teamMembers,
            expectedImpact: si.expectedImpact,
            documentUrl: si.documentUrl,
            status: si.status,
            adminFeedback: si.adminFeedback,
            mentorAssigned: si.mentorAssigned,
          },
          create: {
            id: si.id,
            userId: si.userId,
            title: si.title,
            category: si.category,
            problem: si.problem,
            proposedSolution: si.proposedSolution,
            targetUsers: si.targetUsers,
            market: si.market,
            businessModel: si.businessModel,
            currentStage: si.currentStage,
            teamMembers: si.teamMembers,
            expectedImpact: si.expectedImpact,
            documentUrl: si.documentUrl,
            status: si.status,
            adminFeedback: si.adminFeedback,
            mentorAssigned: si.mentorAssigned,
            createdAt: new Date(si.createdAt),
            updatedAt: new Date(si.updatedAt),
          },
        }),
      () => prisma.startupIdea.count()
    );

    // 11. BlogPost (FK: User optional)
    await migrateModel(
      'BlogPost',
      data.blogs,
      (b) =>
        prisma.blogPost.upsert({
          where: { id: b.id },
          update: {
            title: b.title,
            slug: b.slug,
            excerpt: b.excerpt,
            content: b.content,
            coverImageUrl: b.coverImageUrl,
            category: b.category,
            tags: b.tags,
            authorId: b.authorId,
            authorName: b.authorName,
            isPublished: b.isPublished,
            publishedAt: new Date(b.publishedAt),
            views: b.views,
          },
          create: {
            id: b.id,
            title: b.title,
            slug: b.slug,
            excerpt: b.excerpt,
            content: b.content,
            coverImageUrl: b.coverImageUrl,
            category: b.category,
            tags: b.tags,
            authorId: b.authorId,
            authorName: b.authorName,
            isPublished: b.isPublished,
            publishedAt: new Date(b.publishedAt),
            views: b.views,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt),
          },
        }),
      () => prisma.blogPost.count()
    );

    // 12. Notification (FK: User)
    await migrateModel(
      'Notification',
      data.notifications,
      (n) =>
        prisma.notification.upsert({
          where: { id: n.id },
          update: {
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.isRead,
            link: n.link,
          },
          create: {
            id: n.id,
            userId: n.userId,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.isRead,
            link: n.link,
            createdAt: new Date(n.createdAt),
          },
        }),
      () => prisma.notification.count()
    );

    // 13. Certificate (FK: Event)
    await migrateModel(
      'Certificate',
      data.certificates,
      (c) =>
        prisma.certificate.upsert({
          where: { certificateNumber: c.certificateNumber },
          update: {
            eventId: c.eventId,
            recipientName: c.recipientName,
            recipientEmail: c.recipientEmail,
            issueDate: new Date(c.issueDate),
            verificationUrl: c.verificationUrl,
            fileUrl: c.fileUrl,
          },
          create: {
            id: c.id,
            certificateNumber: c.certificateNumber,
            eventId: c.eventId,
            recipientName: c.recipientName,
            recipientEmail: c.recipientEmail,
            issueDate: new Date(c.issueDate),
            verificationUrl: c.verificationUrl,
            fileUrl: c.fileUrl,
            createdAt: new Date(c.createdAt),
          },
        }),
      () => prisma.certificate.count()
    );

    // 14. AuditLog (FK: User optional)
    await migrateModel(
      'AuditLog',
      data.auditLogs,
      (al) =>
        prisma.auditLog.upsert({
          where: { id: al.id },
          update: {
            action: al.action,
            entity: al.entity,
            entityId: al.entityId,
            details: al.details,
            ipAddress: al.ipAddress,
          },
          create: {
            id: al.id,
            userId: al.userId,
            action: al.action,
            entity: al.entity,
            entityId: al.entityId,
            details: al.details,
            ipAddress: al.ipAddress,
            createdAt: new Date(al.createdAt),
          },
        }),
      () => prisma.auditLog.count()
    );

    // 15. UserLoginActivity (FK: User)
    await migrateModel(
      'UserLoginActivity',
      data.loginActivities,
      (la) =>
        prisma.userLoginActivity.upsert({
          where: { id: la.id },
          update: {
            email: la.email,
            ipAddress: la.ipAddress,
            userAgent: la.userAgent,
            status: la.status,
          },
          create: {
            id: la.id,
            userId: la.userId,
            email: la.email,
            ipAddress: la.ipAddress,
            userAgent: la.userAgent,
            status: la.status,
            createdAt: new Date(la.createdAt),
          },
        }),
      () => prisma.userLoginActivity.count()
    );

    // 16. MembershipApplication (FK: User)
    await migrateModel(
      'MembershipApplication',
      data.membershipApplications,
      (ma) =>
        prisma.membershipApplication.upsert({
          where: { userId: ma.userId },
          update: {
            fullName: ma.fullName,
            email: ma.email,
            phone: ma.phone,
            department: ma.department,
            year: ma.year,
            skills: ma.skills,
            areasOfInterest: ma.areasOfInterest,
            whyJoin: ma.whyJoin,
            previousExperience: ma.previousExperience,
            resumeUrl: ma.resumeUrl,
            status: ma.status,
            adminFeedback: ma.adminFeedback,
            reviewedBy: ma.reviewedBy,
            reviewedAt: ma.reviewedAt ? new Date(ma.reviewedAt) : null,
          },
          create: {
            id: ma.id,
            userId: ma.userId,
            fullName: ma.fullName,
            email: ma.email,
            phone: ma.phone,
            department: ma.department,
            year: ma.year,
            skills: ma.skills,
            areasOfInterest: ma.areasOfInterest,
            whyJoin: ma.whyJoin,
            previousExperience: ma.previousExperience,
            resumeUrl: ma.resumeUrl,
            status: ma.status,
            adminFeedback: ma.adminFeedback,
            reviewedBy: ma.reviewedBy,
            reviewedAt: ma.reviewedAt ? new Date(ma.reviewedAt) : null,
            createdAt: new Date(ma.createdAt),
            updatedAt: new Date(ma.updatedAt),
          },
        }),
      () => prisma.membershipApplication.count()
    );

    console.log('\n--- Phase 3: Multi-Relation Entities ---');

    // 17. EventRegistration (FK: Event + User)
    await migrateModel(
      'EventRegistration',
      data.registrations,
      (reg) =>
        prisma.eventRegistration.upsert({
          where: { ticketCode: reg.ticketCode },
          update: {
            eventId: reg.eventId,
            userId: reg.userId,
            status: reg.status,
            notes: reg.notes,
          },
          create: {
            id: reg.id,
            eventId: reg.eventId,
            userId: reg.userId,
            status: reg.status,
            ticketCode: reg.ticketCode,
            notes: reg.notes,
            createdAt: new Date(reg.createdAt),
            updatedAt: new Date(reg.updatedAt),
          },
        }),
      () => prisma.eventRegistration.count()
    );

    // Summary Verification Table
    console.log('\n======================================================');
    console.log('  MIGRATION PARITY AUDIT SUMMARY');
    console.log('======================================================');
    console.table(
      stats.map((s) => ({
        Model: s.model,
        'Source (SQLite)': s.sourceCount,
        'Target (Neon)': s.migratedCount,
        Parity: s.status,
        Errors: s.errors.length,
      }))
    );

    const hasMismatches = stats.some((s) => s.status !== 'MATCH' || s.errors.length > 0);

    if (hasMismatches) {
      console.error('\n⚠️ WARNING: Some models encountered errors or count mismatches:');
      stats
        .filter((s) => s.errors.length > 0)
        .forEach((s) => {
          console.error(`- ${s.model}: ${s.errors.join('; ')}`);
        });
      process.exit(1);
    } else {
      console.log('🎉 100% DATA PARITY VERIFIED! All 17 models migrated successfully.');
      console.log('   All administrator accounts, student logins, password hashes, and startup ideas are live on Neon.');
      console.log('======================================================\n');
    }
  } catch (error: any) {
    console.error('❌ Critical Migration Failure:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
