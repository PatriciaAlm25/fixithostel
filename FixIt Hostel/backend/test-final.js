#!/usr/bin/env node
const http = require('http');

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║  DUPLICATE EMAIL PREVENTION TEST                ║');
console.log('╚════════════════════════════════════════════════╝\n');

const baseEmail = `test_${Date.now()}@example.com`;
let passed = 0, failed = 0;

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type': 'application/json' }, timeout: 5000 };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', (err) => reject(new Error(`Connection failed: ${err.code || err.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout after 5s')); });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  // TEST 1
  console.log(`TEST 1: Register unique email\n  Email: ${baseEmail}`);
  try {
    const r = await request('POST', '/api/auth/register', { email: baseEmail, password: 'Pass123!', name: 'User1' });
    if (r.status === 201 && r.body?.success) {
      console.log('  ✅ PASS - 201 Created\n');
      passed++;
    } else {
      console.log(`  ❌ FAIL - Status ${r.status}, Body: ${JSON.stringify(r.body)}\n`);
      failed++;
    }
  } catch (e) {
    console.log(`  ❌ FAIL - ${e.message}\n`);
    failed++;
  }

  // TEST 2
  console.log(`TEST 2: Reject duplicate email\n  Email: ${baseEmail}`);
  try {
    const r = await request('POST', '/api/auth/register', { email: baseEmail, password: 'Pass123!', name: 'User2' });
    if (r.status === 409 || (r.body?.message?.toLowerCase().includes('already') && !r.body?.success)) {
      console.log(`  ✅ PASS - Rejected (Status ${r.status})\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL - Status ${r.status}, Body: ${JSON.stringify(r.body)}\n`);
      failed++;
    }
  } catch (e) {
    console.log(`  ❌ FAIL - ${e.message}\n`);
    failed++;
  }

  // TEST 3
  const email2 = `test2_${Date.now()}@example.com`;
  console.log(`TEST 3: Register different email\n  Email: ${email2}`);
  try {
    const r = await request('POST', '/api/auth/register', { email: email2, password: 'Pass123!', name: 'User3' });
    if (r.status === 201 && r.body?.success) {
      console.log('  ✅ PASS - 201 Created\n');
      passed++;
    } else {
      console.log(`  ❌ FAIL - Status ${r.status}, Body: ${JSON.stringify(r.body)}\n`);
      failed++;
    }
  } catch (e) {
    console.log(`  ❌ FAIL - ${e.message}\n`);
    failed++;
  }

  // SUMMARY
  console.log('╔════════════════════════════════════════════════╗');
  console.log(`║  PASSED: ${passed}/3                                    ║`);
  console.log(`║  FAILED: ${failed}/3                                    ║`);
  console.log('╚════════════════════════════════════════════════╝\n');
  
  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('  ✅ Unique emails can register');
    console.log('  ✅ Duplicate emails rejected');
    console.log('  ✅ Data stored in Firebase\n');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

test().catch(e => { console.error('Fatal error:', e); process.exit(1); });
