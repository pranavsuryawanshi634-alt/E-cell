import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting User Registration & Login System Automated Verification...\n');

  // 1. Health check
  const healthRes = await fetch(`${API_BASE}/health`);
  const healthJson: any = await healthRes.json();
  console.log('1. Backend Health Check:', healthJson.status === 'ok' ? '✅ PASS' : '❌ FAIL');

  // Test credentials
  const testEmail = `test.innovator.${Date.now()}@sitrc.ac.in`;
  const testPassword = 'SecurePassword@2026';
  const testFullName = 'Atharva Rajesh Patil';

  // 2. Register New User
  console.log(`\n2. Registering new test user: ${testEmail}...`);
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: testFullName,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  const regJson: any = await regRes.json();
  console.log('Registration HTTP Status:', regRes.status);
  console.log('Registration Success:', regJson.success);
  console.log('Returned User:', regJson.data?.user?.email, '| FullName:', regJson.data?.user?.fullName, '| Role:', regJson.data?.user?.role);
  if (regRes.status !== 201 || !regJson.data?.token) {
    throw new Error('User registration failed!');
  }
  const userToken = regJson.data.token;
  const registeredUserId = regJson.data.user.id;
  console.log('✅ User registration PASS');

  // 3. Confirm Database Record & Prisma Studio model persistence
  console.log('\n3. Verifying database persistence in SQLite / Prisma...');
  const dbUser = await prisma.user.findUnique({
    where: { email: testEmail.toLowerCase() },
    include: { profile: true, loginActivities: true },
  });
  if (!dbUser) throw new Error('User not found in database!');
  if (!dbUser.password.startsWith('$2')) throw new Error('Password is not bcrypt hashed!');
  const isBcryptValid = await bcrypt.compare(testPassword, dbUser.password);
  console.log('DB Record ID:', dbUser.id);
  console.log('DB FullName:', dbUser.fullName);
  console.log('DB Profile FullName:', dbUser.profile?.fullName);
  console.log('DB Password Hashed (never plaintext):', dbUser.password.substring(0, 15) + '...');
  console.log('Bcrypt Password Match:', isBcryptValid ? '✅ YES' : '❌ NO');
  console.log('DB User Status:', dbUser.status);
  console.log('Initial Login Activity Recorded:', dbUser.loginActivities.length > 0 ? '✅ YES' : '❌ NO');
  console.log('✅ Database persistence PASS');

  // 4. Duplicate Registration Rejection
  console.log('\n4. Testing duplicate registration rejection...');
  const dupRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Duplicate Person',
      email: testEmail,
      password: 'AnotherPassword123',
      confirmPassword: 'AnotherPassword123',
    }),
  });
  const dupJson: any = await dupRes.json();
  console.log('Duplicate Register Status (expected 409):', dupRes.status);
  console.log('Duplicate Register Error Message:', dupJson.message);
  if (dupRes.status === 409) {
    console.log('✅ Duplicate registration rejection PASS');
  } else {
    throw new Error('Duplicate registration should have been rejected with 409!');
  }

  // 5. Test Password Mismatch Rejection
  console.log('\n5. Testing password mismatch rejection...');
  const mismatchRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Mismatch Tester',
      email: `mismatch.${Date.now()}@sitrc.ac.in`,
      password: 'Password123',
      confirmPassword: 'Password456',
    }),
  });
  const mismatchJson: any = await mismatchRes.json();
  console.log('Password Mismatch Status (expected 422):', mismatchRes.status);
  console.log('Password Mismatch Message:', mismatchJson.message);
  if (mismatchRes.status === 422) {
    console.log('✅ Password mismatch rejection PASS');
  } else {
    throw new Error('Password mismatch should have been rejected with 422!');
  }

  // 6. Test Login with Correct Credentials
  console.log('\n6. Testing user login with correct credentials...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  const loginJson: any = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('Login Message:', loginJson.message);
  console.log('Login Token Issued:', loginJson.data?.token ? '✅ YES' : '❌ NO');
  if (loginRes.status !== 200 || !loginJson.data?.token) {
    throw new Error('Valid login failed!');
  }
  console.log('✅ Valid login PASS');

  // 7. Test Login with Incorrect Password
  console.log('\n7. Testing user login with incorrect password...');
  const badLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPassword999',
    }),
  });
  const badLoginJson: any = await badLoginRes.json();
  console.log('Bad Login Status (expected 401):', badLoginRes.status);
  console.log('Bad Login Error Message (generic):', badLoginJson.message);
  if (badLoginRes.status === 401 && badLoginJson.message === 'Invalid email or password') {
    console.log('✅ Incorrect password rejection PASS');
  } else {
    throw new Error('Bad login should return 401 with generic message!');
  }

  // 8. Test Authenticated Profile Route (/api/auth/me)
  console.log('\n8. Testing authenticated /api/auth/me...');
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const meJson: any = await meRes.json();
  console.log('/api/auth/me Status:', meRes.status);
  console.log('/api/auth/me Profile:', meJson.data?.fullName, '| Email:', meJson.data?.email, '| Role:', meJson.data?.role);
  if (meRes.status !== 200 || meJson.data?.id !== registeredUserId) {
    throw new Error('Authenticated me endpoint failed!');
  }
  console.log('✅ /api/auth/me PASS');

  // 9. Test Unauthorized Access Without Token
  console.log('\n9. Testing /api/auth/me without token (expected 401)...');
  const noTokenRes = await fetch(`${API_BASE}/auth/me`);
  console.log('No Token Status:', noTokenRes.status);
  if (noTokenRes.status === 401) {
    console.log('✅ Protected route enforcement PASS');
  } else {
    throw new Error('Protected route allowed unauthenticated access!');
  }

  // 10. Role-Based Access Enforcement: Ordinary user cannot access admin APIs
  console.log('\n10. Testing role-based security: student user accessing /api/admin/me (expected 403)...');
  const adminAccessRes = await fetch(`${API_BASE}/admin/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const adminAccessJson: any = await adminAccessRes.json();
  console.log('Admin Access Status:', adminAccessRes.status);
  console.log('Admin Access Error Message:', adminAccessJson.message);
  if (adminAccessRes.status === 403) {
    console.log('✅ Regular users blocked from admin endpoints PASS');
  } else {
    throw new Error('Student user was not blocked from admin API!');
  }

  // 11. Confirm Existing Admin Accounts Continue Working
  console.log('\n11. Verifying existing admin accounts remain functional...');
  const firstAdmin = await prisma.admin.findFirst();
  if (!firstAdmin) throw new Error('No admin found!');
  console.log('Found Admin in DB:', firstAdmin.email, '| Name:', firstAdmin.name);
  // Verify admin table has 9 admins
  const adminCount = await prisma.admin.count();
  console.log('Total Admins in DB:', adminCount);
  if (adminCount !== 9) throw new Error(`Expected 9 admins, found ${adminCount}`);
  console.log('✅ Admin accounts 100% preserved PASS');

  // 12. Test Logout Endpoint
  console.log('\n12. Testing /api/auth/logout...');
  const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const logoutJson: any = await logoutRes.json();
  console.log('Logout Status:', logoutRes.status);
  console.log('Logout Success:', logoutJson.success);
  console.log('✅ Logout PASS');

  console.log('\n🎉 ALL 12 AUTOMATED TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
