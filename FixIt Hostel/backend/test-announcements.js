#!/usr/bin/env node
/**
 * Test: Management Announcement/Notice Posting
 */

const http = require('http');

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║  MANAGEMENT ANNOUNCEMENT POSTING TEST             ║');
console.log('╚══════════════════════════════════════════════════╝\n');

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    };

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

    req.on('error', (err) => reject(new Error(`Connection error: ${err.code || err.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout after 5s')); });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  // Test 1: Management posts announcement
  console.log('TEST 1: Management posts announcement');
  try {
    const res = await makeRequest('POST', '/api/notices', {
      title: 'Hostel Maintenance Notice',
      description: 'The hostel will be closed this weekend',
      content: 'Detailed maintenance information goes here...',
      userRole: 'management',
      userId: 'mgmt_001',
      userName: 'Admin Manager'
    });
    
    if (res.status === 201 && res.body?.success) {
      console.log('  ✅ PASS - Notice posted successfully');
      console.log(`     Notice ID: ${res.body.notice?.id}`);
      console.log(`     Title: ${res.body.notice?.title}\n`);
    } else {
      console.log(`  ❌ FAIL - Status ${res.status}`);
      console.log(`     Response: ${JSON.stringify(res.body)}\n`);
    }
  } catch (e) {
    console.log(`  ❌ ERROR - ${e.message}\n`);
  }

  // Test 2: Non-management tries to post (should fail)
  console.log('TEST 2: Student tries to post (should fail)');
  try {
    const res = await makeRequest('POST', '/api/notices', {
      title: 'Student Notice',
      description: 'This should fail',
      userRole: 'student',
      userId: 'student_001',
      userName: 'Student User'
    });
    
    if (res.status === 403 && !res.body?.success) {
      console.log('  ✅ PASS - Non-management correctly rejected');
      console.log(`     Message: ${res.body?.message}\n`);
    } else {
      console.log(`  ❌ FAIL - Should be rejected but got ${res.status}\n`);
    }
  } catch (e) {
    console.log(`  ❌ ERROR - ${e.message}\n`);
  }

  // Test 3: Get all announcements
  console.log('TEST 3: View all announcements (all users can read)');
  try {
    const res = await makeRequest('GET', '/api/notices', null);
    
    if (res.status === 200 && res.body?.success) {
      console.log('  ✅ PASS - Retrieved announcements');
      console.log(`     Total notices: ${res.body.count}\n`);
    } else {
      console.log(`  ❌ FAIL - Status ${res.status}\n`);
    }
  } catch (e) {
    console.log(`  ❌ ERROR - ${e.message}\n`);
  }

  // Test 4: Another management announcement
  console.log('TEST 4: Another management announcement');
  try {
    const res = await makeRequest('POST', '/api/notices', {
      title: 'WiFi Upgrade Complete',
      description: 'New high-speed WiFi installed',
      content: 'New password: fixit2024...',
      userRole: 'management',
      userId: 'mgmt_002',
      userName: 'Tech Manager'
    });
    
    if (res.status === 201 && res.body?.success) {
      console.log('  ✅ PASS - Second notice posted');
      console.log(`     Title: ${res.body.notice?.title}\n`);
    } else {
      console.log(`  ❌ FAIL - Status ${res.status}\n`);
    }
  } catch (e) {
    console.log(`  ❌ ERROR - ${e.message}\n`);
  }

  console.log('✅ Tests complete\n');
}

test().catch(e => { console.error('Fatal:', e); process.exit(1); });
