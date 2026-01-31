#!/usr/bin/env node

/**
 * Test API Endpoints - Registration, OTP, and Login
 * Tests the complete flow through HTTP API endpoints
 */

const http = require('http');

const API_URL = 'http://localhost:3000/api';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAPIFlow() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          API Endpoint Test - Registration & Login     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const testEmail = `apitest${Date.now()}@example.com`;
  const testPassword = 'ApiTest123!';
  let generatedOtp = null;

  try {
    // Test 1: Send OTP
    console.log('📧 Test 1: Send OTP via API');
    console.log('─'.repeat(56));
    const otpRes = await makeRequest('POST', '/auth/send-otp', { email: testEmail });
    console.log(`Status: ${otpRes.status}`);
    console.log(`Response:`, JSON.stringify(otpRes.data, null, 2));
    
    if (otpRes.status !== 200) {
      console.log('❌ OTP sending failed');
      return;
    }

    // For testing, use a dummy OTP
    generatedOtp = '123456';
    console.log(`\n📌 Using OTP: ${generatedOtp}`);

    // Test 2: Register via API
    console.log('\n📝 Test 2: Register via API');
    console.log('─'.repeat(56));
    const registerRes = await makeRequest('POST', '/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'API Test User',
      otp: generatedOtp,
      role: 'student',
      hostel: 'Hostel A',
      block: 'Block 1',
      room_no: '101',
      department: 'CSE',
      college: 'Test College',
      year: '1',
      dob: '2005-01-15',
      age: 19,
    });

    console.log(`Status: ${registerRes.status}`);
    console.log(`Response:`, JSON.stringify(registerRes.data, null, 2));

    if (registerRes.status !== 201 && registerRes.status !== 200) {
      console.log('❌ Registration failed');
      return;
    }

    const token = registerRes.data.token;
    console.log(`\n✅ Token received: ${token?.substring(0, 20)}...`);

    // Test 3: Login via API
    console.log('\n🔐 Test 3: Login via API');
    console.log('─'.repeat(56));
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: testPassword,
    });

    console.log(`Status: ${loginRes.status}`);
    console.log(`Response:`, JSON.stringify(loginRes.data, null, 2));

    if (loginRes.status !== 200) {
      console.log('❌ Login failed');
      return;
    }

    const loginToken = loginRes.data.token;
    console.log(`\n✅ Login successful! Token: ${loginToken?.substring(0, 20)}...`);
    console.log(`   User: ${loginRes.data.user?.email}`);

    // Test 4: Get current user
    console.log('\n👤 Test 4: Get Current User via API');
    console.log('─'.repeat(56));
    const meRes = await makeRequest('GET', `/auth/me?email=${testEmail}`);
    console.log(`Status: ${meRes.status}`);
    console.log(`Response:`, JSON.stringify(meRes.data, null, 2));

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ API TESTS COMPLETED                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  }
}

testAPIFlow();
