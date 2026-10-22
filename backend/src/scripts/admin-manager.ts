import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const prisma = new PrismaClient();

function promptInput(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hidden && process.stdin.isTTY) {
      process.stdout.write(question);
      let input = '';
      const onData = (char: Buffer) => {
        const str = char.toString();
        if (str === '\n' || str === '\r' || str === '\u0004') {
          process.stdin.removeListener('data', onData);
          if (process.stdin.setRawMode) process.stdin.setRawMode(false);
          process.stdout.write('\n');
          rl.close();
          resolve(input.trim());
        } else if (str === '\u0003') {
          process.exit();
        } else if (str === '\b' || str === '\u007f') {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          input += str;
          process.stdout.write('*');
        }
      };

      if (process.stdin.setRawMode) process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

function parseArgs(): { command?: string; email?: string; name?: string; password?: string; hard?: boolean } {
  const args = process.argv.slice(2);
  const result: { command?: string; email?: string; name?: string; password?: string; hard?: boolean } = {};

  if (args.length > 0 && !args[0].startsWith('-')) {
    result.command = args[0].toLowerCase();
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === '--email' || arg === '-e') && args[i + 1]) {
      result.email = args[++i];
    } else if (arg.startsWith('--email=')) {
      result.email = arg.split('=')[1];
    } else if ((arg === '--name' || arg === '-n') && args[i + 1]) {
      result.name = args[++i];
    } else if (arg.startsWith('--name=')) {
      result.name = arg.split('=')[1];
    } else if ((arg === '--password' || arg === '-p') && args[i + 1]) {
      result.password = args[++i];
    } else if (arg.startsWith('--password=')) {
      result.password = arg.split('=')[1];
    } else if (arg === '--hard') {
      result.hard = true;
    }
  }

  return result;
}

async function listAdmins() {
  console.log('\n======================================================');
  console.log('  E-Cell SITRC: Registered Administrator Accounts');
  console.log('======================================================\n');

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (admins.length === 0) {
    console.log('No administrator accounts found in database.');
    return;
  }

  console.log(
    `${'#'.padEnd(3)} | ${'Status'.padEnd(8)} | ${'Name'.padEnd(22)} | ${'Email'.padEnd(32)} | Role`
  );
  console.log('-'.repeat(80));

  admins.forEach((admin, i) => {
    const status = admin.isActive ? 'ACTIVE' : 'INACTIVE';
    console.log(
      `${(i + 1).toString().padEnd(3)} | ${status.padEnd(8)} | ${admin.name.padEnd(22)} | ${admin.email.padEnd(32)} | ${admin.role}`
    );
  });
  console.log('\nTotal administrators:', admins.length);
}

async function createAdmin(cliEmail?: string, cliName?: string, cliPassword?: string) {
  console.log('\n--- Create New Administrator Account ---');

  let email = cliEmail;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  while (!email || !emailRegex.test(email.trim())) {
    email = await promptInput('Enter Administrator Email: ');
    if (!emailRegex.test(email.trim())) {
      console.log('⚠️ Please enter a valid email address.');
    }
  }
  email = email.trim().toLowerCase();

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`⚠️ An administrator with email "${email}" already exists (Status: ${existing.isActive ? 'Active' : 'Deactivated'}).`);
    console.log('Use "npm run admin:password" to change password or update status.');
    return;
  }

  let name = cliName;
  while (!name || name.trim().length < 2) {
    name = await promptInput('Enter Administrator Full Name: ');
    if (name.trim().length < 2) {
      console.log('⚠️ Name must be at least 2 characters.');
    }
  }

  let password = cliPassword;
  while (!password || password.length < 8) {
    password = await promptInput('Enter Administrator Password (min 8 chars): ', true);
    if (password.length < 8) {
      console.log('⚠️ Password must be at least 8 characters long.');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.create({
    data: {
      name: name.trim(),
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Sync to User table
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true,
        profile: {
          create: {
            fullName: name.trim(),
            college: 'Sandip Institute of Technology and Research Centre',
            department: 'E-Cell Administrative Control Center',
          },
        },
      },
    });
  } else {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', password: hashedPassword },
    });
  }

  console.log(`\n✅ Administrator "${admin.name}" <${admin.email}> created successfully!`);
}

async function changePassword(cliEmail?: string, cliPassword?: string) {
  console.log('\n--- Change Administrator Password ---');

  let email = cliEmail;
  while (!email) {
    email = await promptInput('Enter Administrator Email: ');
  }
  email = email.trim().toLowerCase();

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    console.log(`❌ No administrator found with email: ${email}`);
    return;
  }

  let password = cliPassword;
  while (!password || password.length < 8) {
    password = await promptInput('Enter New Password (min 8 chars): ', true);
    if (password.length < 8) {
      console.log('⚠️ Password must be at least 8 characters long.');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.admin.update({
    where: { email },
    data: {
      password: hashedPassword,
      isActive: true, // reactivate if was deactivated
    },
  });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }

  console.log(`\n✅ Password for administrator <${email}> has been updated securely.`);
}

async function removeAdmin(cliEmail?: string, hardDelete = false) {
  console.log('\n--- Remove / Deactivate Administrator ---');

  let email = cliEmail;
  while (!email) {
    email = await promptInput('Enter Administrator Email to Remove: ');
  }
  email = email.trim().toLowerCase();

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    console.log(`❌ No administrator found with email: ${email}`);
    return;
  }

  if (hardDelete) {
    await prisma.admin.delete({ where: { email } });
    console.log(`\n🗑️ Administrator <${email}> record permanently deleted.`);
  } else {
    await prisma.admin.update({
      where: { email },
      data: { isActive: false },
    });
    console.log(`\n🔒 Administrator <${email}> has been deactivated. They cannot sign in.`);
    console.log('   (To permanently delete, pass --hard flag).');
  }
}

async function main() {
  const args = parseArgs();
  const cmd = args.command || 'list';

  switch (cmd) {
    case 'create':
      await createAdmin(args.email, args.name, args.password);
      break;
    case 'password':
      await changePassword(args.email, args.password);
      break;
    case 'remove':
    case 'delete':
      await removeAdmin(args.email, args.hard);
      break;
    case 'list':
    default:
      await listAdmins();
      break;
  }
}

main()
  .catch((e) => {
    console.error('❌ Operation failed:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
