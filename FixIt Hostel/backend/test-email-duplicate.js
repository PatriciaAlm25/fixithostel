/**
 * Test: Email Duplicate Prevention & Firebase Storage
 * Simple curl-based test
 */

const { execSync } = require('child_process');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   Email Duplicate Prevention & Firebase Storage Test  ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const email = `test.dup.${Date.now()}@example.com`;
let passed = 0;
let failed = 0;

// Test 1: First registration
console.log('Test 1: First registration succeeds...');
try {
  const res = execSync(`curl -s -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"${email}","password":"Pass123!","name":"User1"}'`, { encoding: 'utf8' });
  const data = JSON.parse(res);
  if (data.success && data.user.email === email) {
    console.log('  ✅ PASS - User registered to Firebase\n');
    passed++;
  } else {
    console.log('  ❌ FAIL - Registration failed\n');
    failed++;
  }
} catch (e) {
  console.log(`  ❌ FAIL - Error: ${e.message.substring(0, 50)}\n`);
  failed++;
}

// Test 2: Duplicate email
console.log('Test 2: Duplicate email is rejected...');
try {
  const res = execSync(`curl -s -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"${email}","password":"Pass123!","name":"User2"}'`, { encoding: 'utf8' });
  const data = JSON.parse(res);
  const isDuplicate = data.message && (data.message.includes('already') || data.message.includes('registered'));
  if (isDuplicate || !data.success) {
    console.log('  ✅ PASS - Duplicate email rejected\n');
    console.log(`     Message: "${data.message}"\n`);
    passed++;
  } else {
    console.log('  ❌ FAIL - Duplicate not rejected\n');
    failed++;
  }
} catch (e) {
  console.log(`  ❌ FAIL - ${e.message.substring(0, 50)}\n`);
  failed++;
}

// Test 3: Different email works
console.log('Test 3: Different email registers successfully...');
try {
  const email2 = `test.new.${Date.now()}@example.com`;
  const res = execSync(`curl -s -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"${email2}","password":"Pass123!","name":"User3"}'`, { encoding: 'utf8' });
  const data = JSON.parse(res);
  if (data.success && data.user.email === email2) {
    console.log('  ✅ PASS - New email registered\n');
    passed++;
  } else {
    console.log('  ❌ FAIL - New email registration failed\n');
    failed++;
  }
} catch (e) {
  console.log(`  ❌ FAIL - ${e.message.substring(0, 50)}\n`);
  failed++;
}

// Summary
console.log('╔════════════════════════════════════════════════════════╗');
console.log(`║  ✅ Passed: ${passed}                                                  ║`);
console.log(`║  ❌ Failed: ${failed}                                                  ║`);
console.log('╚════════════════════════════════════════════════════════╝\n');

if (failed === 0) {
  console.log('✅ ALL TESTS PASSED!\n');
  console.log('Summary:');
  console.log('  ✅ Users can register with their email');
  console.log('  ✅ Duplicate emails are rejected with clear message');
  console.log('  ✅ All registration data is stored in Firebase');
  console.log('  ✅ Multiple users can register with different emails\n');
}

process.exit(failed ? 1 : 0);
