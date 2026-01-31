#!/usr/bin/env node

/**
 * Test Authentication Flow
 * Tests: OTP sending, Registration, and Login
 */

const http = require('http');

const API_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        FixIt Hostel - Auth Flow Test Suite             ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  let generatedOtp = null;

  try {
    // Test 1: Check health
    console.log('🔍 Test 1: Health Check');
    console.log('─'.repeat(56));
    const healthRes = await makeRequest('GET', '/health');
    console.log(`✅ Status: ${healthRes.status}`);
    console.log(`Response: ${JSON.stringify(healthRes.data, null, 2)}`);

    // Test 2: Send OTP
    console.log('\n🔍 Test 2: Send OTP');
    console.log('─'.repeat(56));
    console.log(`📧 Email: ${testEmail}`);
    const otpRes = await makeRequest('POST', '/api/auth/send-otp', {
      email: testEmail,
    });
    console.log(`✅ Status: ${otpRes.status}`);
    console.log(`Response: ${JSON.stringify(otpRes.data, null, 2)}`);
    
    // For demo mode, use a dummy OTP
    generatedOtp = '123456';
    console.log(`\n📌 Using OTP: ${generatedOtp} (for demo mode)`);

    // Test 3: Register User
    console.log('\n🔍 Test 3: Register User');
    console.log('─'.repeat(56));
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      otp: generatedOtp,
      role: 'student',
      hostel: 'A',
      block: '1',
      room_no: '101',
      department: 'CSE',
      college: 'Test College',
      year: '1',
      dob: '2005-01-15',
      age: 19,
    });
    console.log(`✅ Status: ${registerRes.status}`);
    if (registerRes.status === 201 || registerRes.status === 200) {
      console.log(`✅ Registration successful!`);
      console.log(`📊 Response:`, JSON.stringify(registerRes.data, null, 2));
    } else {
      console.log(`❌ Registration failed!`);
      console.log(`📊 Response:`, JSON.stringify(registerRes.data, null, 2));
    }

    // Test 4: Login
    console.log('\n🔍 Test 4: Login');
    console.log('─'.repeat(56));
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    console.log(`✅ Status: ${loginRes.status}`);
    if (loginRes.status === 200) {
      console.log(`✅ Login successful!`);
      console.log(`📊 Response:`, JSON.stringify(loginRes.data, null, 2));
    } else {
      console.log(`❌ Login failed!`);
      console.log(`📊 Response:`, JSON.stringify(loginRes.data, null, 2));
    }

    // Test 5: Check user was saved to database
    console.log('\n🔍 Test 5: Verify User in Local Database');
    console.log('─'.repeat(56));
    const fs = require('fs');
    const userDbPath = './users.db.json';
    if (fs.existsSync(userDbPath)) {
      const db = JSON.parse(fs.readFileSync(userDbPath, 'utf-8'));
      const registeredUser = Object.values(db.users || {}).find(
        (u) => u.email === testEmail
      );
      if (registeredUser) {
        console.log(`✅ User found in local database!`);
        console.log(`📊 User data:`, JSON.stringify(registeredUser, null, 2));
      } else {
        console.log(`❌ User NOT found in local database`);
      }
    } else {
      console.log(`⚠️ Database file not found: ${userDbPath}`);
    }

    // Test 6: Check Supabase connection
    console.log('\n🔍 Test 6: Email Configuration Test');
    console.log('─'.repeat(56));
    const emailRes = await makeRequest('GET', '/api/auth/test-email');
    console.log(`✅ Status: ${emailRes.status}`);
    console.log(`Response: ${JSON.stringify(emailRes.data, null, 2)}`);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                  🎉 Tests Complete 🎉                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
