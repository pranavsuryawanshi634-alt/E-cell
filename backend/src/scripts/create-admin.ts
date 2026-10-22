import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

function promptInput(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hidden && process.stdin.isTTY) {
      // In interactive TTY, we can mask the password
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
          // Ctrl+C
          process.exit();
        } else if (str === '\b' || str === '\u007f') {
          // Backspace
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

function parseCliArgs(): { name?: string; email?: string; password?: string } {
  const args = process.argv.slice(2);
  const result: { name?: string; email?: string; password?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      result.name = args[++i];
    } else if (args[i] === '--email' && args[i + 1]) {
      result.email = args[++i];
    } else if (args[i] === '--password' && args[i + 1]) {
      result.password = args[++i];
    }
  }
  return result;
}

async function main() {
  console.log('\n======================================================');
  console.log('  E-Cell SITRC: Secure Administrator Provisioning CLI');
  console.log('======================================================\n');

  const cliArgs = parseCliArgs();

  // 1. Prompt or get Name
  let name = cliArgs.name;
  while (!name || name.trim().length < 2) {
    name = await promptInput('Enter Administrator Full Name: ');
    if (name.trim().length < 2) {
      console.log('⚠️ Name must be at least 2 characters long.');
    }
  }

  // 2. Prompt or get Email
  let email = cliArgs.email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  while (!email || !emailRegex.test(email.trim())) {
    email = await promptInput('Enter Administrator Email: ');
    if (!emailRegex.test(email.trim())) {
      console.log('⚠️ Please enter a valid email address (e.g. admin@sitrc.ac.in).');
    }
  }
  email = email.trim().toLowerCase();

  // 3. Prompt or get Password
  let password = cliArgs.password;
  while (!password || password.length < 6) {
    password = await promptInput('Enter Security Password (min 6 chars): ', true);
    if (password.length < 6) {
      console.log('⚠️ Password must be at least 6 characters long.');
    }
  }

  console.log('\n🔒 Hashing password securely with bcrypt (12 salt rounds)...');
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Check if Admin already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`\nℹ️ An admin account for ${email} already exists.`);
    const updateChoice = await promptInput('Do you want to update the password for this admin? (y/N): ');
    if (updateChoice.toLowerCase() === 'y' || updateChoice.toLowerCase() === 'yes') {
      const updated = await prisma.admin.update({
        where: { email },
        data: {
          name: name.trim(),
          password: hashedPassword,
          isActive: true,
        },
      });
      console.log(`\n✅ Administrator credentials updated successfully!`);
      console.log(`   ID:    ${updated.id}`);
      console.log(`   Name:  ${updated.name}`);
      console.log(`   Email: ${updated.email}`);
      console.log(`   Role:  ${updated.role}`);
    } else {
      console.log('Operation cancelled. No changes made.');
    }
  } else {
    // Create new Admin record
    const newAdmin = await prisma.admin.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    // Also synchronize or ensure corresponding User record exists for unified access
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
              department: 'Administrative Control Center',
            },
          },
        },
      });
    } else if (existingUser.role !== 'ADMIN') {
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN', password: hashedPassword },
      });
    }

    console.log(`\n🎉 New Administrator account created successfully!`);
    console.log(`   ID:        ${newAdmin.id}`);
    console.log(`   Name:      ${newAdmin.name}`);
    console.log(`   Email:     ${newAdmin.email}`);
    console.log(`   Role:      ${newAdmin.role}`);
    console.log(`   Status:    Active`);
    console.log(`   Timestamp: ${newAdmin.createdAt.toISOString()}`);
  }

  console.log('\n======================================================');
  console.log('You can now sign in at http://localhost:5173/admin/login');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Failed to provision administrator:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
