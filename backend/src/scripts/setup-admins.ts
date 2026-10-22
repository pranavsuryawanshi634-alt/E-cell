import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';
import { AUTHORIZED_ADMIN_LIST } from '../config/admins';

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

function parseCliPassword(): string | undefined {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--password' || args[i] === '-p') && args[i + 1]) {
      return args[i + 1];
    }
    if (args[i].startsWith('--password=')) {
      return args[i].split('=')[1];
    }
  }
  return undefined;
}

async function main() {
  console.log('\n======================================================');
  console.log('  E-Cell SITRC: Authorized Administrator Setup System');
  console.log('======================================================\n');
  console.log(`Found ${AUTHORIZED_ADMIN_LIST.length} authorized administrator accounts to provision:`);
  AUTHORIZED_ADMIN_LIST.forEach((admin, idx) => {
    console.log(`  ${idx + 1}. ${admin.name.padEnd(22)} <${admin.email}>`);
  });
  console.log('\n------------------------------------------------------');

  // Determine initial password securely
  // 1. Check environment variable ADMIN_INITIAL_PASSWORD or ADMIN_SETUP_PASSWORD
  // 2. Check CLI argument --password
  // 3. Prompt interactively
  let initialPassword =
    process.env.ADMIN_INITIAL_PASSWORD ||
    process.env.ADMIN_SETUP_PASSWORD ||
    parseCliPassword();

  if (!initialPassword) {
    console.log('\n🔐 Setting initial password for authorized accounts:');
    while (!initialPassword || initialPassword.length < 8) {
      initialPassword = await promptInput(
        'Enter secure initial password for administrators (min 8 characters): ',
        true
      );
      if (initialPassword.length < 8) {
        console.log('⚠️ Password must be at least 8 characters long for security compliance.');
      }
    }
  } else {
    if (initialPassword.length < 8) {
      throw new Error('Configured initial password must be at least 8 characters long.');
    }
    console.log('🔑 Initial password sourced securely from environment / CLI.');
  }

  console.log('\n🔒 Hashing password with bcrypt (12 salt rounds)...');
  const hashedPassword = await bcrypt.hash(initialPassword, 12);

  console.log('💾 Provisioning administrator accounts into database...\n');

  const results: Array<{ name: string; email: string; id: string; status: string }> = [];

  const resetExistingPasswords = process.argv.includes('--reset-passwords') || process.argv.includes('--force');
  if (resetExistingPasswords) {
    console.log('⚠️ --reset-passwords flag detected: Existing administrator passwords will be overwritten.');
  } else {
    console.log('🛡️ Default safe mode: Existing administrator passwords will be PRESERVED and not overwritten.');
  }

  for (const adminConfig of AUTHORIZED_ADMIN_LIST) {
    const normalizedEmail = adminConfig.email.toLowerCase().trim();

    // 1. Upsert into Admin table
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    let adminRecord;
    let statusText = 'CREATED';

    if (existingAdmin) {
      adminRecord = await prisma.admin.update({
        where: { email: normalizedEmail },
        data: {
          name: adminConfig.name,
          ...(resetExistingPasswords ? { password: hashedPassword } : {}),
          role: adminConfig.role,
          isActive: true,
        },
      });
      statusText = resetExistingPasswords ? 'UPDATED (Password reset)' : 'PRESERVED (Password unchanged)';
    } else {
      adminRecord = await prisma.admin.create({
        data: {
          name: adminConfig.name,
          email: normalizedEmail,
          password: hashedPassword,
          role: adminConfig.role,
          isActive: true,
        },
      });
    }

    // 2. Synchronize with User table for unified permissions
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: 'ADMIN',
          isVerified: true,
          profile: {
            create: {
              fullName: adminConfig.name,
              college: 'Sandip Institute of Technology and Research Centre',
              department: 'E-Cell Administrative Control Center',
            },
          },
        },
      });
    } else {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          role: 'ADMIN',
          ...(resetExistingPasswords ? { password: hashedPassword } : {}),
          isVerified: true,
        },
      });
    }

    results.push({
      name: adminRecord.name,
      email: adminRecord.email,
      id: adminRecord.id,
      status: statusText,
    });
  }

  console.log('======================================================');
  console.log('  PROVISIONING SUMMARY');
  console.log('======================================================');
  results.forEach((res, i) => {
    console.log(
      `  [${res.status}] ${i + 1}. ${res.email.padEnd(32)} (${res.name}) - ID: ${res.id.slice(0, 8)}...`
    );
  });
  console.log('\n✅ All 9 authorized administrators are now configured and active.');
  console.log('   Administrators can sign in at: http://localhost:5173/admin/login');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Administrator provisioning failed:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
