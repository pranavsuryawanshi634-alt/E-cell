/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting E-Cell database seed...');

  // Clean existing tables (in proper order for foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.membershipApplication.deleteMany();
  await prisma.startupIdea.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.event.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const coordHash = await bcrypt.hash('Coord@123', 10);
  const memberHash = await bcrypt.hash('Member@123', 10);
  const studentHash = await bcrypt.hash('Student@123', 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ecell.org',
      password: passwordHash,
      role: 'ADMIN',
      profile: {
        create: {
          fullName: 'Prof. Rajesh Kulkarni',
          phone: '+91 9822012345',
          college: 'Sandip Institute of Engineering & Management',
          department: 'Dean - Innovation & Incubation',
          year: 'Faculty',
          division: 'A',
          bio: 'Head of SIEM E-Cell, Incubation Mentor, and Senior Faculty in Innovation & Entrepreneurship.',
          linkedinUrl: 'https://linkedin.com/in/rajesh-kulkarni-ecell',
          skills: 'Incubation, Venture Capital, Academic Innovation, Startup Mentoring',
        },
      },
    },
  });

  // 2. Create 2 Coordinators
  const coordTech = await prisma.user.create({
    data: {
      email: 'coord.tech@ecell.org',
      password: coordHash,
      role: 'COORDINATOR',
      profile: {
        create: {
          fullName: 'Aarav Deshmukh',
          phone: '+91 9822123456',
          college: 'Sandip Institute of Engineering & Management',
          department: 'Computer Engineering',
          year: 'BE',
          division: 'A',
          bio: 'Overall Technical & Hackathon Lead. NEC 2026 Core Delegate.',
          linkedinUrl: 'https://linkedin.com/in/aarav-deshmukh',
          githubUrl: 'https://github.com/aarav-deshmukh',
          skills: 'Full Stack, Cloud, Hackathon Organization, System Architecture',
        },
      },
    },
  });

  const coordEvents = await prisma.user.create({
    data: {
      email: 'coord.events@ecell.org',
      password: coordHash,
      role: 'COORDINATOR',
      profile: {
        create: {
          fullName: 'Ananya Sharma',
          phone: '+91 9822234567',
          college: 'Sandip Institute of Engineering & Management',
          department: 'Information Technology',
          year: 'TE',
          division: 'B',
          bio: 'Lead Event Manager and Industry Relations Coordinator.',
          linkedinUrl: 'https://linkedin.com/in/ananya-sharma-ecell',
          skills: 'Event Curation, Speaker Outreach, Pitch Competitions, Public Relations',
        },
      },
    },
  });

  // 3. Create 5 E-Cell Members
  const members = [];
  const memberConfigs = [
    { name: 'Rohan Patil', email: 'member1@ecell.org', dept: 'Mechanical', role: 'E_CELL_MEMBER', skills: 'Hardware Prototyping, IoT, Logistics', bio: 'Technical Operations Member' },
    { name: 'Snehal Joshi', email: 'member2@ecell.org', dept: 'Computer Engineering', role: 'E_CELL_MEMBER', skills: 'UI/UX Design, Figma, Brand Identity', bio: 'Design & Creative Lead' },
    { name: 'Kunal Shinde', email: 'member3@ecell.org', dept: 'AI & Data Science', role: 'E_CELL_MEMBER', skills: 'Social Media Marketing, Content Strategy', bio: 'Marketing & Digital Outreach' },
    { name: 'Pooja Verma', email: 'member4@ecell.org', dept: 'Civil Engineering', role: 'E_CELL_MEMBER', skills: 'Finance, Sponsorship Pitches, Budgeting', bio: 'Treasury & Sponsorship Coordinator' },
    { name: 'Aditya Mehta', email: 'member5@ecell.org', dept: 'Electrical Engineering', role: 'E_CELL_MEMBER', skills: 'Public Speaking, Workshop Hosting, Anchor', bio: 'Public Relations & Stage Host' },
  ];

  for (const m of memberConfigs) {
    const user = await prisma.user.create({
      data: {
        email: m.email,
        password: memberHash,
        role: m.role,
        profile: {
          create: {
            fullName: m.name,
            phone: `+91 9823${Math.floor(100000 + Math.random() * 900000)}`,
            college: 'Sandip Institute of Engineering & Management',
            department: m.dept,
            year: 'TE',
            division: 'A',
            bio: m.bio,
            skills: m.skills,
          },
        },
      },
    });
    members.push(user);
  }

  // 4. Create 20 Students
  const students = [];
  const depts = ['Computer Engineering', 'Information Technology', 'AI & Data Science', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'];
  const years = ['FE', 'SE', 'TE', 'BE'];
  const studentNames = [
    'Tanmay Borse', 'Priya Kulkarni', 'Saurabh Jadhav', 'Neha Gaikwad', 'Vikas Chavan',
    'Ishita Roy', 'Harshvardhan More', 'Riddhi Salunkhe', 'Omkar Tambe', 'Shreya Pawar',
    'Akash Nawale', 'Kavita Ghuge', 'Tejas Wagh', 'Simran Bhati', 'Nikhil Date',
    'Gauri Mahajan', 'Pratik Hire', 'Bhavika Somani', 'Siddhesh Khairnar', 'Manasi Thorat'
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i + 1}@ecell.org`,
        password: studentHash,
        role: 'STUDENT',
        profile: {
          create: {
            fullName: studentNames[i],
            phone: `+91 9890${100000 + i * 2341}`,
            college: 'Sandip Institute of Engineering & Management',
            department: depts[i % depts.length],
            year: years[i % years.length],
            division: String.fromCharCode(65 + (i % 3)),
            bio: `Aspiring tech entrepreneur and innovator in ${depts[i % depts.length]}.`,
            skills: 'Problem Solving, Python, Business Strategy, Public Speaking',
          },
        },
      },
    });
    students.push(student);
  }

  // 5. Create 8 Events
  const eventsData = [
    {
      title: 'IIT Bombay Entrepreneurship Workshop 2026',
      slug: 'iit-bombay-entrepreneurship-workshop-2026',
      description: 'An exclusive hands-on workshop conducted by E-Cell IIT Bombay mentors at SIEM Nashik campus. Learn venture validation, market entry frameworks, and pitch deck mastery.',
      eventType: 'WORKSHOP',
      date: new Date('2026-10-18T10:00:00Z'),
      startTime: '10:00 AM',
      endTime: '04:30 PM',
      venue: 'Main Auditorium, SIEM Campus, Nashik',
      organizer: 'SIEM E-CELL in collaboration with IIT Bombay',
      registrationDeadline: new Date('2026-10-17T23:59:59Z'),
      maxParticipants: 150,
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      speakerName: 'Dr. Siddharth Rao (IIT Bombay Incubation)',
      speakerBio: 'Director of Venture Programs at E-Cell IIT Bombay, mentor to 50+ seed stage student startups.',
      rules: 'Open to all SIEM and Sandip Foundation students. Laptops recommended for interactive pitch drafting.',
      eligibility: 'All Engineering & Management students',
      status: 'REGISTRATION_OPEN',
      isFeatured: true,
      createdById: admin.id,
    },
    {
      title: 'InnovateX 24-Hour Campus Hackathon',
      slug: 'innovatex-24hr-hackathon',
      description: 'A 24-hour sprint to build AI, CleanTech, and AgriTech solutions for tier-2/3 Indian markets. Win cash prizes of Rs 50,000 + incubation grant support.',
      eventType: 'HACKATHON',
      date: new Date('2026-10-25T09:00:00Z'),
      startTime: '09:00 AM',
      endTime: '09:00 AM (+1 Day)',
      venue: 'Central Computing Facility (CCF), SIEM',
      organizer: 'Technical Wing, SIEM E-Cell',
      registrationDeadline: new Date('2026-10-23T18:00:00Z'),
      maxParticipants: 100,
      bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      speakerName: 'Amitabh Sen (CTO, Pune TechVentures)',
      speakerBio: 'Ex-Google engineer, angel investor, and prominent hackathon jury member across Western India.',
      rules: 'Teams of 2 to 4 members. Working prototype required during final pitch evaluation.',
      eligibility: 'Undergraduate and Diploma engineering students',
      status: 'REGISTRATION_OPEN',
      isFeatured: true,
      createdById: coordTech.id,
    },
    {
      title: 'Venture Pitch Arena 2026',
      slug: 'venture-pitch-arena-2026',
      description: 'Pitch your breakthrough startup idea directly in front of seed angel investors, venture capitalists, and Sandip Foundation Incubation Cell leaders.',
      eventType: 'COMPETITION',
      date: new Date('2026-11-05T11:00:00Z'),
      startTime: '11:00 AM',
      endTime: '05:00 PM',
      venue: 'Seminar Hall 2, Mechanical Block',
      organizer: 'SIEM Incubation CELL & NEC Team',
      registrationDeadline: new Date('2026-11-02T23:59:59Z'),
      maxParticipants: 40,
      bannerUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&auto=format&fit=crop&q=80',
      speakerName: 'Pooja Kulkarni (Managing Partner, Nashik Angels)',
      speakerBio: 'Venture investor focused on AgriTech and B2B SaaS in Maharashtra.',
      rules: 'Submit a 7-slide pitch deck by the deadline. 5 minutes pitch followed by 3 minutes Q&A.',
      eligibility: 'Student founders and early stage alumni teams',
      status: 'REGISTRATION_OPEN',
      isFeatured: true,
      createdById: admin.id,
    },
    {
      title: 'Founder Fireside Chat: From Campus to $2M ARR',
      slug: 'founder-fireside-chat-campus-to-arr',
      description: 'An unfiltered, candid fireside talk with SIEM alumni founder Nikhil Desale sharing how he scaled his logistics SaaS company right from the college dorm room.',
      eventType: 'GUEST_LECTURE',
      date: new Date('2026-11-12T14:00:00Z'),
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      venue: 'Smart Classroom 101, IT Dept',
      organizer: 'Alumni Cell & E-Cell',
      registrationDeadline: new Date('2026-11-11T20:00:00Z'),
      maxParticipants: 80,
      bannerUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80',
      speakerName: 'Nikhil Desale (Founder, TrackSwift)',
      speakerBio: '2021 SIEM Alumnus who bootstrapped TrackSwift to over $2M annual recurring revenue.',
      rules: 'Registration mandatory to reserve hall seating. Open interactive Q&A session.',
      eligibility: 'Open to all students & faculty',
      status: 'REGISTRATION_OPEN',
      isFeatured: false,
      createdById: coordEvents.id,
    },
    {
      title: 'Design Thinking & Lean Canvas Bootcamp',
      slug: 'design-thinking-lean-canvas-bootcamp',
      description: 'Master the 1-page Lean Business Model Canvas. Uncover customer pain points, value propositions, unit economics, and unfair advantages.',
      eventType: 'BOOTCAMP',
      date: new Date('2026-11-20T09:30:00Z'),
      startTime: '09:30 AM',
      endTime: '03:30 PM',
      venue: 'SIEM Innovation Lab',
      organizer: 'E-Cell Design & Strategy Team',
      registrationDeadline: new Date('2026-11-18T18:00:00Z'),
      maxParticipants: 60,
      bannerUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&auto=format&fit=crop&q=80',
      speakerName: 'Megha Chitnis (Principal UX & Product Strategist)',
      speakerBio: 'Ex-Design Lead at Freshworks, now mentoring product incubators.',
      rules: 'Canvas templates and stationery provided at the venue. Group exercises.',
      eligibility: '1st, 2nd & 3rd Year Students',
      status: 'REGISTRATION_OPEN',
      isFeatured: false,
      createdById: coordEvents.id,
    },
    {
      title: 'E-Cell Speed Networking & Co-Founder Matching',
      slug: 'speed-networking-cofounder-matching',
      description: 'Looking for a technical co-founder, UI designer, or business strategist for your idea? Join 100+ motivated campus creators in this structured matchmaking session.',
      eventType: 'NETWORKING',
      date: new Date('2026-12-02T16:00:00Z'),
      startTime: '04:00 PM',
      endTime: '06:30 PM',
      venue: 'Open Amphitheatre, Sandip Campus',
      organizer: 'SIEM E-Cell Community Wing',
      registrationDeadline: new Date('2026-12-01T23:59:59Z'),
      maxParticipants: 120,
      bannerUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
      speakerName: 'Team Sandip EcoInnovators',
      speakerBio: 'National Entrepreneurship Challenge delegates sharing collaboration frameworks.',
      rules: 'Bring your ideas, portfolio links, or enthusiasm to team up!',
      eligibility: 'All students across Sandip Foundation',
      status: 'REGISTRATION_OPEN',
      isFeatured: false,
      createdById: admin.id,
    },
    {
      title: 'National Entrepreneurship Challenge (NEC) 2026 Prep Series',
      slug: 'nec-2026-prep-series',
      description: 'Special mentorship sessions for teams representing Sandip Institute at the IIT Bombay National Entrepreneurship Challenge 2026.',
      eventType: 'SEMINAR',
      date: new Date('2026-10-10T11:00:00Z'),
      startTime: '11:00 AM',
      endTime: '01:00 PM',
      venue: 'Virtual & Seminar Hall 1',
      organizer: 'Team Sandip EcoInnovators',
      registrationDeadline: new Date('2026-10-09T23:59:59Z'),
      maxParticipants: 200,
      bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      speakerName: 'Core E-Cell Leadership',
      speakerBio: 'SIEM NEC Taskforce leads reviewing milestone submissions.',
      rules: 'Attendance required for cohort members.',
      eligibility: 'Registered Cohort Teams',
      status: 'COMPLETED',
      isFeatured: false,
      createdById: admin.id,
    },
    {
      title: 'Intellectual Property & Patent Filing for Student Innovators',
      slug: 'ip-patent-filing-student-innovators',
      description: 'Understanding provisional patents, copyrights, trademarks, and government grants for university research commercialization.',
      eventType: 'SEMINAR',
      date: new Date('2026-12-15T10:30:00Z'),
      startTime: '10:30 AM',
      endTime: '01:30 PM',
      venue: 'Auditorium 2, Sandip Campus',
      organizer: 'SIEM IPR Cell & E-Cell',
      registrationDeadline: new Date('2026-12-14T23:59:59Z'),
      maxParticipants: 100,
      bannerUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1200&auto=format&fit=crop&q=80',
      speakerName: 'Adv. Suresh Vartak (Patent Attorney)',
      speakerBio: 'Registered Indian Patent Attorney with 18 years experience in deeptech patents.',
      rules: 'Interactive drafting clinic with sample patent claims.',
      eligibility: 'Final & Pre-final year project teams',
      status: 'REGISTRATION_OPEN',
      isFeatured: false,
      createdById: admin.id,
    },
  ];

  const createdEvents = [];
  for (const ev of eventsData) {
    const event = await prisma.event.create({ data: ev });
    createdEvents.push(event);
  }

  // 6. Create 10 Event Registrations
  for (let i = 0; i < 10; i++) {
    const student = students[i];
    const event = createdEvents[i % 3]; // distribute over first 3 active events
    await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        userId: student.id,
        status: i === 9 ? 'WAITLISTED' : 'CONFIRMED',
        ticketCode: `EC-SIEM-2026-${1000 + i}`,
        notes: i === 0 ? 'Interested in AgriTech track' : undefined,
      },
    });
    // increment participant count
    await prisma.event.update({
      where: { id: event.id },
      data: { currentParticipants: { increment: 1 } },
    });
  }

  // 7. Create 5 Membership Applications
  const membershipData = [
    {
      student: students[0],
      skills: 'React, Node.js, Next.js, Figma, Git',
      areasOfInterest: 'Technical Development, Hackathons, Web Platform',
      whyJoin: 'I want to build real digital tools for student founders and organize regional hackathons that put SIEM on the national startup map.',
      experience: 'Winner of Smart India Hackathon internal round 2025; Full-stack developer for college fest portal.',
      status: 'APPROVED',
      adminFeedback: 'Welcome to the Technical Wing! Please connect with Aarav Deshmukh.',
    },
    {
      student: students[1],
      skills: 'Graphic Design, Canva, Adobe Illustrator, Reels & Short Form Video',
      areasOfInterest: 'Creative & Social Media Marketing, Brand Identity',
      whyJoin: 'Passionate about visual storytelling and building an irresistible brand voice for our entrepreneurship events.',
      experience: 'Managed social media handles for college IEEE student branch with 200% engagement growth.',
      status: 'PENDING',
    },
    {
      student: students[2],
      skills: 'Financial Modeling, Pitch Decks, Corporate Outreach',
      areasOfInterest: 'Sponsorship, Corporate Partnerships, Angel Networks',
      whyJoin: 'Keen to connect with Nashik industries and secure brand sponsorships for our flagship E-Summit 2026.',
      experience: 'Secured Rs 35,000 sponsorship for department symposium.',
      status: 'PENDING',
    },
    {
      student: students[3],
      skills: 'Public Speaking, Anchoring, Logistics Coordination',
      areasOfInterest: 'Event Operations, Stage Management, Guest Hospitality',
      whyJoin: 'E-Cell creates transformative energy on campus. I want to ensure every guest speaker and attendee has a flawless experience.',
      experience: 'Host for National Science Day events at Sandip Foundation.',
      status: 'APPROVED',
      adminFeedback: 'Approved for Events & Operations team under Ananya Sharma.',
    },
    {
      student: students[4],
      skills: 'Basic Coding',
      areasOfInterest: 'General volunteering',
      whyJoin: 'Want to hang out with startup peers and get certificates.',
      experience: 'None yet.',
      status: 'REJECTED',
      adminFeedback: 'Please gain specific domain interest and re-apply in the next cohort semester.',
    },
  ];

  for (const m of membershipData) {
    await prisma.membershipApplication.create({
      data: {
        userId: m.student.id,
        fullName: studentNames[students.indexOf(m.student)],
        email: m.student.email,
        phone: `+91 982299${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'Computer Engineering',
        year: 'TE',
        skills: m.skills,
        areasOfInterest: m.areasOfInterest,
        whyJoin: m.whyJoin,
        previousExperience: m.experience,
        status: m.status,
        adminFeedback: m.adminFeedback,
        reviewedBy: m.status !== 'PENDING' ? admin.id : undefined,
        reviewedAt: m.status !== 'PENDING' ? new Date() : undefined,
      },
    });
  }

  // 8. Create 5 Startup Ideas
  const ideasData = [
    {
      student: students[5],
      title: 'KisanDirect - Smart Onion Storage & Micro-Cold Chain',
      problem: 'Post-harvest losses in Nashik onion belt exceed 35% due to improper humidity and temperature during storage.',
      solution: 'Solar-powered IoT sensor kits and localized decentralized micro-cold storages with automated humidity evacuation.',
      targetUsers: 'Small & marginal onion farmers, farmer producer organizations (FPOs) across Maharashtra.',
      market: 'Rs 12,000 Cr vegetable storage and post-harvest market in Western India.',
      businessModel: 'B2B subscription hardware lease + SaaS analytics dashboard at Rs 499/month per storage bay.',
      currentStage: 'Prototype / MVP',
      teamMembers: 'Ishita Roy (Tech), Saurabh Jadhav (Hardware), Omkar Tambe (Field Ops)',
      expectedImpact: 'Reduce crop rotting by 60% and improve farmer realization prices by 25%.',
      status: 'SHORTLISTED',
      adminFeedback: 'High potential for SIEM Incubation grant. Scheduled for Pitch Arena round.',
    },
    {
      student: students[6],
      title: 'EcoPack - Biodegradable Packaging from Sugarcane Bagasse',
      problem: 'Single-use plastic food containers create massive non-recyclable landfill waste in college cafeterias and food courts.',
      solution: 'Water-resistant, biodegradable takeaway trays and cutlery manufactured from locally sourced sugarcane bagasse waste.',
      targetUsers: 'Cloud kitchens, campus cafeterias, QSR chains across Nashik and Pune.',
      market: 'Rapidly expanding Indian eco-packaging sector estimated at $3.5B by 2028.',
      businessModel: 'Direct B2B manufacturing and bulk distribution supply contract.',
      currentStage: 'Proof of Concept',
      teamMembers: 'Harshvardhan More (Materials), Priya Kulkarni (Operations)',
      expectedImpact: 'Divert 5 tons of single-use plastic waste per month per institution.',
      status: 'ACCEPTED',
      adminFeedback: 'Accepted into SIEM Student Incubation Cohort 2026. Lab allocation granted.',
    },
    {
      student: students[7],
      title: 'CampusRide - Peer-to-Peer Electric Two-Wheeler Sharing',
      problem: 'Hostel students lack affordable, quick last-mile transit between Sandip campus and Nashik city hub.',
      solution: 'App-controlled smart geofenced e-scooters with RFID student ID unlocks and solar charging stations.',
      targetUsers: '15,000+ residential and day scholars at Sandip Foundation campus.',
      market: 'Campus micro-mobility across university clusters.',
      businessModel: 'Pay-per-minute (Rs 2/min) + monthly student transit passes.',
      currentStage: 'Ideation',
      teamMembers: 'Riddhi Salunkhe (App Dev), Vikas Chavan (Electrical)',
      expectedImpact: 'Safe, zero-emission green campus mobility.',
      status: 'UNDER_REVIEW',
      adminFeedback: 'Under review by Campus Operations and Safety Committee.',
    },
    {
      student: students[8],
      title: 'AI Proctor & Code Intelligence for Campus Placements',
      problem: 'Colleges spend lakhs on third-party assessment software that fails to detect subtle AI code generation cheating.',
      solution: 'Custom lightweight IDE that analyzes keystroke dynamics, eye-gaze tracking, and semantic plagiarism in real-time.',
      targetUsers: 'Engineering colleges, Training & Placement officers, recruiting companies.',
      market: 'EdTech and placement assessments in India ($600M+).',
      businessModel: 'Annual institutional license fee per enrolled batch.',
      currentStage: 'Prototype / MVP',
      teamMembers: 'Omkar Tambe (Lead Dev)',
      expectedImpact: 'Fairer, verified campus hiring with verifiable skill audits.',
      status: 'SUBMITTED',
    },
    {
      student: students[9],
      title: 'DormChef - Student Hyperlocal Meal Customizer',
      problem: 'Repetitive hostel mess food forces students to eat unhygienic street food.',
      solution: 'Curated home-cooked tiffin aggregator connecting verified local homemakers with hostel students.',
      targetUsers: 'Hostel residents in Trimbak Road educational hub.',
      market: 'Student food service in university towns.',
      businessModel: '15% commission on meal subscriptions.',
      currentStage: 'Ideation',
      teamMembers: 'Shreya Pawar (Product)',
      expectedImpact: 'Healthy student diet while generating supplemental income for local families.',
      status: 'REJECTED',
      adminFeedback: 'Requires food safety FSSAI compliance and logistics scalability study. Rework team structure.',
    },
  ];

  for (const idea of ideasData) {
    await prisma.startupIdea.create({
      data: {
        userId: idea.student.id,
        title: idea.title,
        problem: idea.problem,
        proposedSolution: idea.solution,
        targetUsers: idea.targetUsers,
        market: idea.market,
        businessModel: idea.businessModel,
        currentStage: idea.currentStage,
        teamMembers: idea.teamMembers,
        expectedImpact: idea.expectedImpact,
        status: idea.status,
        adminFeedback: idea.adminFeedback,
      },
    });
  }

  // 9. Create 5 Announcements
  const announcementsData = [
    {
      title: 'Team Sandip EcoInnovators Selected as Official SIEM Representative at NEC 2026 (IIT Bombay)',
      content: 'We are thrilled to announce that our flagship cohort team "Sandip EcoInnovators" has advanced to the National Entrepreneurship Challenge (NEC) 2026 organized by E-Cell IIT Bombay. Join us in cheering for our innovators!',
      priority: 'HIGH',
      category: 'National Competitions',
      linkUrl: 'https://siemecell.netlify.app/',
    },
    {
      title: 'Registrations Open: SIEM Student Entrepreneurship Cohort & Incubation Lab 2026',
      content: 'Applications are formally open for student founders seeking seed funding, faculty mentorship, prototype lab access, and IPR filing assistance for 2026.',
      priority: 'HIGH',
      category: 'Incubation',
      linkUrl: '/ideas',
    },
    {
      title: 'Upcoming Entrepreneurship Workshop by IIT Bombay Mentors on 18 October 2026',
      content: 'Learn early customer discovery, venture validation, and fundraising basics directly from IIT Bombay incubation leadership. Registration seats are capped at 150.',
      priority: 'MEDIUM',
      category: 'Workshops',
      linkUrl: '/events/iit-bombay-entrepreneurship-workshop-2026',
    },
    {
      title: 'Call for SIEM E-Cell Core Team Recruits 2026-27',
      content: 'Passionate about design, web development, event hosting, or sponsorship? Apply now for core leadership roles in the SIEM E-Cell Student Executive Council.',
      priority: 'MEDIUM',
      category: 'Recruitment',
      linkUrl: '/team',
    },
    {
      title: 'New Government & MSME Student Startup Grant Portal Launched',
      content: 'The Innovation Cell has updated the document templates for students applying to the Maharashtra State Student Innovation Scheme (NISP). Download guidelines from the student dashboard.',
      priority: 'LOW',
      category: 'Funding & Grants',
      linkUrl: '/announcements',
    },
  ];

  for (const ann of announcementsData) {
    await prisma.announcement.create({ data: ann });
  }

  // 10. Create 5 Blog Posts
  const blogsData = [
    {
      title: 'From College Idea to Scalable Startup: The 5 Phases Every Student Founder Faces',
      slug: 'from-college-idea-to-scalable-startup-5-phases',
      excerpt: 'Starting up while managing engineering lectures, exams, and labs sounds impossible. Here is the exact roadmap SIEM founders follow to build without burning out.',
      content: `### The College Startup Paradox\n\nBeing a student founder is arguably the greatest unfair advantage you will ever have in your career. You have zero mortgage payments, free Wi-Fi, brilliant peers in hardware, software, and mechanical disciplines sitting in adjacent hostel rooms, and professors eager to guide your technical hypotheses.\n\nYet, 90% of student projects never leave the Final Year Project showcase. Why?\n\n### 1. Fall in Love With the Problem, Not Your Code\nMost student teams spend 3 months building a 20-feature application before ever talking to a single customer. The first rule taught at SIEM E-Cell: **Validate the pain point first.**\n\n### 2. The Lean MVP\nYour Minimum Viable Product (MVP) should test the riskiest assumption. If you are building an AgriTech supply chain, your MVP isn't a complex microservices platform—it is a WhatsApp group connecting 10 farmers to 3 local buyers.\n\n### 3. Assembling the Complementary Trio\nEvery enduring startup team needs:\n- **The Hacker:** Builds the tech.\n- **The Hustler:** Sells the vision and talks to users.\n- **The Designer:** Makes the experience effortless.\n\n### 4. Taking Advantage of Campus Incubation\nUtilize the SIEM Incubation Cell for legal agreements, provisional patent applications, and zero-rent workspace. Join our cohorts and pitch competitions to refine your narrative!`,
      category: 'Entrepreneurship',
      tags: 'Startup, College Founders, Lean Canvas, MVP',
      coverImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80',
      views: 342,
      authorId: admin.id,
      authorName: 'Prof. Rajesh Kulkarni',
    },
    {
      title: 'How Team Sandip EcoInnovators Tackled the IIT Bombay NEC 2026 Challenge',
      slug: 'how-team-sandip-ecoinnovators-tackled-nec-2026',
      excerpt: 'Behind the scenes of SIEM representatives competing at Asia\'s largest entrepreneurship tournament organized by E-Cell IIT Bombay.',
      content: `The National Entrepreneurship Challenge (NEC) by IIT Bombay isn't a simple pitch contest—it is an 8-month intensive endurance test requiring colleges to create real entrepreneurship ecosystems, conduct campus workshops, assist grassroots startups, and drive venture awareness.\n\nOur team—Sandip EcoInnovators—focused on sustainability and clean energy innovations. By partnering with local farmers in Trimbak and Nashik industrial zones, we identified crucial green manufacturing bottlenecks.\n\nHere are our key takeaways for students aspiring to represent SIEM in the next national cohort:\n- Consistency beats sudden cramming.\n- Metrics matter: track attendees, feedback forms, and follow-ups.\n- Mentorship is the differentiator: our mentors at IIT Bombay challenged every basic premise of our business plan until it was razor sharp.`,
      category: 'Campus Innovation',
      tags: 'NEC 2026, IIT Bombay, EcoInnovators, Competition',
      coverImageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',
      views: 520,
      authorId: coordTech.id,
      authorName: 'Aarav Deshmukh',
    },
    {
      title: 'Demystifying Venture Capital: What Seed Investors Actually Look For',
      slug: 'demystifying-venture-capital-seed-investors',
      excerpt: 'Angel investor Pooja Kulkarni breaks down the anatomy of a persuasive 10-slide student pitch deck.',
      content: `When investors listen to student pitches, they know your historical revenue numbers will be low or non-existent. So what are they evaluating?\n\n1. **Founder-Market Fit:** Why are YOU uniquely obsessed with solving this problem?\n2. **Speed of Execution:** Did you build this in 3 weeks or 2 years? High momentum is the strongest proxy for future success.\n3. **Clarity of Thought:** Can you explain your business model in two sentences without buzzwords?\n\nAvoid generic statements like 'We have no competitors.' Having no competitors usually means there is no market. Instead, show how current alternatives fail your target user.`,
      category: 'Founder Interviews',
      tags: 'Funding, Venture Capital, Angel Investors, Pitching',
      coverImageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
      views: 289,
      authorId: coordEvents.id,
      authorName: 'Ananya Sharma',
    },
    {
      title: 'AI in 2026: The Generative Wave Shaping Campus Startups',
      slug: 'ai-in-2026-generative-wave-shaping-startups',
      excerpt: 'Why raw wrapper apps are dying and where the real opportunities lie in vertical AI for Indian manufacturing and agriculture.',
      content: `The era of simple ChatGPT wrappers is definitively over. In 2026, sustainable AI startups must combine:\n- Proprietary localized domain data.\n- Tight workflow automation.\n- Defensible integration into existing legacy business processes.\n\nAt SIEM, our AI and Computer Engineering students are developing custom computer vision models for sorting agricultural harvest quality and automated vernacular audio dispatchers for logistics. These are problems Silicon Valley will never build for Nashik—and that is where student moats exist.`,
      category: 'Tech Trends',
      tags: 'Artificial Intelligence, DeepTech, Machine Learning, Automation',
      coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      views: 415,
      authorId: coordTech.id,
      authorName: 'Aarav Deshmukh',
    },
    {
      title: 'Building a Campus Startup Culture: Why Every Student Should Try',
      slug: 'building-a-campus-startup-culture',
      excerpt: 'Even if your first company fails, the skills gained—sales, product building, resilience—guarantee you will never be an ordinary employee.',
      content: `The worst outcome of starting a company in college is not failure. The worst outcome is never having tried and constantly wondering 'what if'.\n\nWhen you recruit team members for your startup, manage budget spreadsheets, negotiate with vendors, and debug servers at 3 AM before an investor demo, you acquire 5 years of professional growth in 6 months.\n\nEmployers at top tech companies consistently favor student founders who failed over students who simply memorized textbook algorithms. Embrace the risk!`,
      category: 'Startup Stories',
      tags: 'Culture, Mindset, Leadership, College Life',
      coverImageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
      views: 310,
      authorId: admin.id,
      authorName: 'Prof. Rajesh Kulkarni',
    },
  ];

  for (const b of blogsData) {
    await prisma.blogPost.create({ data: b });
  }

  // 11. Create Team Members (Categories: Leadership, Technical, Marketing, Events, Design, Finance, Operations)
  const teamMembersData = [
    {
      name: 'Prof. Dr. D. P. Patil',
      role: 'Patron & Principal',
      category: 'Leadership',
      department: 'Administration',
      year: 'Faculty',
      bio: 'Principal, SIEM Nashik. Chief Mentor guiding innovation initiatives and national rankings.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com',
      order: 1,
    },
    {
      name: 'Prof. Rajesh Kulkarni',
      role: 'Faculty Convener & Head of Incubation',
      category: 'Leadership',
      department: 'Innovation & Incubation',
      year: 'Faculty',
      bio: '20+ years of academic and entrepreneurial leadership. Oversees SIEM E-Cell operations.',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com',
      order: 2,
    },
    {
      name: 'Aarav Deshmukh',
      role: 'President & Overall Coordinator',
      category: 'Leadership',
      department: 'Computer Engineering',
      year: 'BE',
      bio: 'Leading Team Sandip EcoInnovators at NEC 2026 IIT Bombay. Full stack builder.',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com',
      githubUrl: 'https://github.com',
      order: 3,
    },
    {
      name: 'Ananya Sharma',
      role: 'Vice President & Head of Initiatives',
      category: 'Leadership',
      department: 'Information Technology',
      year: 'TE',
      bio: 'Curating flagship E-Summit, industry conclaves, and founder networking series.',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com',
      order: 4,
    },
    {
      name: 'Rohan Patil',
      role: 'Technical Lead',
      category: 'Technical Team',
      department: 'Computer Engineering',
      year: 'TE',
      bio: 'Architecting digital portal, hackathon judging systems, and server infrastructure.',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com',
      githubUrl: 'https://github.com',
      order: 5,
    },
    {
      name: 'Snehal Joshi',
      role: 'Creative & UI/UX Head',
      category: 'Design Team',
      department: 'Computer Engineering',
      year: 'TE',
      bio: 'Crafting brand collateral, user journeys, event branding, and web design systems.',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com',
      order: 6,
    },
    {
      name: 'Kunal Shinde',
      role: 'Head of Marketing & Digital Media',
      category: 'Marketing Team',
      department: 'AI & Data Science',
      year: 'TE',
      bio: 'Managing social outreach, video podcasts, campus ambassadors, and media partnerships.',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com',
      order: 7,
    },
    {
      name: 'Pooja Verma',
      role: 'Head of Corporate Relations & Sponsorship',
      category: 'Finance Team',
      department: 'Civil Engineering',
      year: 'TE',
      bio: 'Connecting SIEM startup founders with corporate sponsors and seed grant funds.',
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com',
      order: 8,
    },
    {
      name: 'Aditya Mehta',
      role: 'Head of Operations & Logistics',
      category: 'Operations Team',
      department: 'Mechanical Engineering',
      year: 'TE',
      bio: 'Directing stage setup, venue hospitality, audio-visuals, and attendee security.',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com',
      order: 9,
    },
  ];

  for (const tm of teamMembersData) {
    await prisma.teamMember.create({ data: tm });
  }

  // 12. Create Gallery Items
  const galleryData = [
    {
      title: 'IIT Bombay Mentors Interaction at SIEM Campus',
      category: 'Workshops',
      imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&auto=format&fit=crop&q=80',
      description: 'Orientation session for SIEM cohort teams competing at NEC 2026.',
      date: new Date('2026-09-15'),
    },
    {
      title: 'InnovateX 24-Hour Hackathon Final Pitch Round',
      category: 'Hackathons',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&auto=format&fit=crop&q=80',
      description: 'Top 10 student engineering teams presenting live prototypes to jury.',
      date: new Date('2026-08-20'),
    },
    {
      title: 'Team Sandip EcoInnovators Delegation Photo',
      category: 'Team',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
      description: 'SIEM E-Cell Core committee at the campus incubation center.',
      date: new Date('2026-09-01'),
    },
    {
      title: 'Annual Campus Startup Showcase & Investor Meet',
      category: 'Events',
      imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1000&auto=format&fit=crop&q=80',
      description: 'Over 300 students and 15 angel investors gathered at the main auditorium.',
      date: new Date('2026-07-12'),
    },
    {
      title: 'Design Thinking & Prototyping Workshop',
      category: 'Workshops',
      imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&auto=format&fit=crop&q=80',
      description: 'Hands-on Lean Canvas mapping with color-coded sticky notes and wireframes.',
      date: new Date('2026-06-08'),
    },
    {
      title: 'Sandip Foundation Central Tech Conclave',
      category: 'Campus',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80',
      description: 'Keynote address on regional student entrepreneurship support schemes.',
      date: new Date('2026-05-18'),
    },
  ];

  for (const gi of galleryData) {
    await prisma.galleryItem.create({ data: gi });
  }

  // 13. Create Sponsors & Partners
  const sponsorsData = [
    {
      name: 'E-Cell IIT Bombay',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      websiteUrl: 'https://ecell.in',
      tier: 'ECOSYSTEM_PARTNER',
      description: 'National Entrepreneurship Challenge (NEC 2026) Partner.',
    },
    {
      name: 'Sandip Foundation Incubation Hub',
      logoUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&auto=format&fit=crop&q=80',
      websiteUrl: 'https://sandipfoundation.org',
      tier: 'TITLE',
      description: 'Campus Host, Seed Funding & Research Lab Infrastructure.',
    },
    {
      name: 'Nashik Angels Network',
      logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200&auto=format&fit=crop&q=80',
      websiteUrl: 'https://example.com',
      tier: 'GOLD',
      description: 'Early Stage Angel Investor & Mentorship Network.',
    },
    {
      name: 'AWS Activate for Startups',
      logoUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200&auto=format&fit=crop&q=80',
      websiteUrl: 'https://aws.amazon.com/activate/',
      tier: 'SILVER',
      description: 'Cloud Credits & Technical Architecture Support.',
    },
  ];

  for (const sp of sponsorsData) {
    await prisma.sponsor.create({ data: sp });
  }

  // 14. Create Contact Messages
  const contactMessagesData = [
    {
      name: 'Rajesh Varma',
      email: 'rajesh.varma@tcs.com',
      phone: '+91 9820011223',
      subject: 'CSR Mentorship Partnership for Student Founders',
      message: 'Greetings from TCS Corporate CSR. We are keen to offer virtual mentors for your upcoming SIEM Hackathon teams.',
      status: 'NEW',
    },
    {
      name: 'Pooja Deshmukh',
      email: 'pooja.d@gmail.com',
      phone: '+91 9765432109',
      subject: 'Inquiry regarding Pitch Arena Registration Deadline',
      message: 'Can 1st year diploma students participate in the Venture Pitch Arena if partnered with an engineering senior?',
      status: 'IN_PROGRESS',
    },
  ];

  for (const cm of contactMessagesData) {
    await prisma.contactMessage.create({ data: cm });
  }

  // 15. Create Notifications for Students & Admin
  const sampleNotifications = [
    {
      userId: students[0].id,
      title: 'Membership Application Approved! 🎉',
      message: 'Congratulations! Your application to the SIEM E-Cell Technical Wing has been approved by Admin.',
      type: 'SUCCESS',
      link: '/dashboard/applications',
    },
    {
      userId: students[0].id,
      title: 'Event Registration Confirmed',
      message: 'You have successfully registered for the IIT Bombay Entrepreneurship Workshop 2026. Ticket code: EC-SIEM-2026-1000.',
      type: 'EVENT',
      link: '/dashboard/events',
    },
    {
      userId: students[5].id,
      title: 'Startup Idea Shortlisted! 🚀',
      message: 'Your idea "KisanDirect - Smart Onion Storage" has been shortlisted for the Venture Pitch Arena.',
      type: 'SUCCESS',
      link: '/dashboard/ideas',
    },
    {
      userId: admin.id,
      title: 'New Startup Idea Submitted',
      message: 'Student Omkar Tambe submitted "AI Proctor & Code Intelligence for Campus Placements".',
      type: 'INFO',
      link: '/admin/ideas',
    },
  ];

  for (const n of sampleNotifications) {
    await prisma.notification.create({ data: n });
  }

  // 16. Create Initial Audit Logs
  const auditLogsData = [
    {
      userId: admin.id,
      action: 'SYSTEM_INITIALIZED',
      entity: 'System',
      entityId: 'global',
      details: 'E-Cell management platform database seeded with official 2026 ecosystem data.',
    },
    {
      userId: admin.id,
      action: 'EVENT_CREATED',
      entity: 'Event',
      entityId: createdEvents[0].id,
      details: 'Created flagship event: IIT Bombay Entrepreneurship Workshop 2026.',
    },
    {
      userId: admin.id,
      action: 'MEMBERSHIP_APPROVED',
      entity: 'MembershipApplication',
      entityId: students[0].id,
      details: 'Approved Tanmay Borse into Technical Team.',
    },
  ];

  for (const al of auditLogsData) {
    await prisma.auditLog.create({ data: al });
  }

  console.log('✅ Seed completed successfully:');
  console.log(`- 1 Admin: admin@ecell.org / Admin@123`);
  console.log(`- 2 Coordinators: coord.tech@ecell.org, coord.events@ecell.org / Coord@123`);
  console.log(`- 5 Members: member1@ecell.org to member5@ecell.org / Member@123`);
  console.log(`- 20 Students: student1@ecell.org to student20@ecell.org / Student@123`);
  console.log(`- 8 Events across Workshops, Hackathons, Competitions`);
  console.log(`- 10 Event Registrations with ticket codes`);
  console.log(`- 5 Membership Applications`);
  console.log(`- 5 Startup Ideas`);
  console.log(`- 5 Announcements`);
  console.log(`- 5 Blogs`);
  console.log(`- 9 Team Members`);
  console.log(`- 6 Gallery items, 4 Sponsors, and Audit logs.`);
}

main()
  .catch((e) => {
    console.error('❌ Error in seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
