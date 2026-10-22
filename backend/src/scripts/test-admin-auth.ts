import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function postJson(url: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function getJson(url: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'GET',
    headers,
  });
  const data: any = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  E-Cell SITRC: Automated Admin Security Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string, extra?: any) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`, extra || '');
    }
  }

  const testEmail = process.env.TEST_ADMIN_EMAIL || 'pranavsuryawanshi634@gmail.com';
  const testPassword = process.env.TEST_ADMIN_PASSWORD || '';
  if (!testPassword) {
    console.log('ℹ️ TEST_ADMIN_PASSWORD environment variable not set. Skipping live credential test.');
    return;
  }

  // Test 1: Successful Login
  console.log('TEST 1: Successful Administrator Authentication');
  const loginRes = await postJson(`${API_BASE}/admin/login`, {
    email: testEmail,
    password: testPassword,
  });
  assert(loginRes.status === 200, `Returns HTTP 200 OK (Got ${loginRes.status})`);
  assert(loginRes.data?.success === true, 'Response success is true');
  assert(typeof loginRes.data?.data?.token === 'string', 'Returns secure JWT auth token');
  assert(loginRes.data?.data?.admin?.email === testEmail, `Returns correct admin profile (${testEmail})`);
  assert(loginRes.data?.data?.admin?.role === 'ADMIN', 'Role is ADMIN');
  assert(!loginRes.data?.data?.admin?.password, 'Password hash is NEVER exposed');

  const adminToken = loginRes.data?.data?.token;

  // Test 2: Incorrect Password
  console.log('\nTEST 2: Authentication with Incorrect Password');
  const wrongPassRes = await postJson(`${API_BASE}/admin/login`, {
    email: testEmail,
    password: 'CompletelyWrongPassword!999',
  });
  assert(wrongPassRes.status === 401, `Rejects invalid password with HTTP 401 (Got ${wrongPassRes.status})`);
  assert(wrongPassRes.data?.success === false, 'Response success is false');
  assert(wrongPassRes.data?.message?.includes('Invalid administrator'), 'Provides clear security error message');

  // Test 3: Unauthorized / Unknown Email
  console.log('\nTEST 3: Unauthorized Access by Unknown Email');
  const unauthRes = await postJson(`${API_BASE}/admin/login`, {
    email: 'unauthorized.intruder@gmail.com',
    password: testPassword,
  });
  assert(unauthRes.status === 401, `Rejects unknown email with HTTP 401 (Got ${unauthRes.status})`);
  assert(unauthRes.data?.success === false, 'Response success is false');

  // Test 4: Protected Admin Profile Endpoint with Valid Token
  console.log('\nTEST 4: Protected GET /api/admin/me with Valid Token');
  const meRes = await getJson(`${API_BASE}/admin/me`, adminToken);
  assert(meRes.status === 200, `Returns HTTP 200 OK (Got ${meRes.status})`);
  assert(meRes.data?.data?.admin?.email === testEmail, 'Verified admin identity from token');

  // Test 5: Protected Admin Profile Endpoint without Token
  console.log('\nTEST 5: Protected GET /api/admin/me without Token');
  const noTokenMe = await getJson(`${API_BASE}/admin/me`);
  assert(noTokenMe.status === 401, `Rejects request without token with HTTP 401 (Got ${noTokenMe.status})`);

  // Test 6: Admin-Protected Content Route with Valid Token
  console.log('\nTEST 6: Protected Content Management API with Admin Token');
  const eventsRes = await postJson(
    `${API_BASE}/announcements`,
    {
      title: 'Security System Health Check Broadcast',
      content: 'Automated test of admin content management verification.',
      priority: 'LOW',
      category: 'General',
    },
    adminToken
  );
  assert(
    eventsRes.status === 201 || eventsRes.status === 200,
    `Admin token allows content creation (Got ${eventsRes.status})`
  );

  // Test 7: Admin-Protected Content Route without Token
  console.log('\nTEST 7: Protected Content Route without Token');
  const unauthPost = await postJson(`${API_BASE}/announcements`, {
    title: 'Hacked Announcement',
    content: 'Should be rejected without token.',
  });
  assert(unauthPost.status === 401, `Rejects unauthorized content creation with HTTP 401 (Got ${unauthPost.status})`);

  // Test 8: Logout Endpoint
  console.log('\nTEST 8: Logout and Session Termination');
  const logoutRes = await postJson(`${API_BASE}/admin/logout`, {}, adminToken);
  assert(logoutRes.status === 200, `Logout returns HTTP 200 OK (Got ${logoutRes.status})`);
  assert(logoutRes.data?.success === true, 'Logout success is true');

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} / ${total} assertions passed.`);
  if (passed === total) {
    console.log('🎉 ALL SECURITY AND AUTHENTICATION TESTS PASSED!');
  } else {
    console.error('⚠️ SOME TESTS FAILED.');
  }
  console.log('======================================================\n');
}

runTests().catch(console.error);
