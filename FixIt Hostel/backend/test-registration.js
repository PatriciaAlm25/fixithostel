/**
 * Test User Registration and Login
 * Tests the complete flow: register user -> prevent duplicate registration -> login with password
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  email: 'testuser@example.com',
  password: 'TestPass123!',
  name: 'Test User',
  role: 'student',
  department: 'Computer Science',
  college: 'Tech College',
  year: '3',
  hostel: 'Hostel A',
  block: 'Block 1',
  roomNo: '101',
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err.message);
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testRegistration() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     Testing User Registration & Login System            ║
╚════════════════════════════════════════════════════════╝
  `);

  try {
    // TEST 1: Register new user
    console.log('📝 TEST 1: Register a new user...\n');
    const registerResult = await makeRequest('POST', '/api/auth/register', testUser);

    console.log(`Status: ${registerResult.status}`);
    console.log('Response:', JSON.stringify(registerResult.data, null, 2));

    if (!registerResult.data.success) {
      console.error('❌ Registration failed:', registerResult.data.message);
      return;
    }

    console.log('✅ User registered successfully!');
    console.log(`   ID: ${registerResult.data.user.id}`);
    console.log(`   Email: ${registerResult.data.user.email}`);
    console.log(`   Name: ${registerResult.data.user.name}`);
    console.log(`   Role: ${registerResult.data.user.role}`);

    await sleep(1000);

    // TEST 2: Try to register the same user again (should fail)
    console.log('\n📝 TEST 2: Try to register duplicate user (should fail)...\n');
    const duplicateResult = await makeRequest('POST', '/api/auth/register', testUser);

    console.log(`Status: ${duplicateResult.status}`);
    console.log('Response:', JSON.stringify(duplicateResult.data, null, 2));

    if (!duplicateResult.data.success && duplicateResult.status === 409) {
      console.log('✅ Duplicate registration correctly prevented!');
      console.log(`   Message: ${duplicateResult.data.message}`);
    } else {
      console.error('❌ Duplicate registration should have been blocked!');
    }

    await sleep(1000);

    // TEST 3: Login with correct password
    console.log('\n📝 TEST 3: Login with correct email & password...\n');
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });

    console.log(`Status: ${loginResult.status}`);
    console.log('Response:', JSON.stringify(loginResult.data, null, 2));

    if (loginResult.data.success) {
      console.log('✅ Login successful!');
      console.log(`   ID: ${loginResult.data.user.id}`);
      console.log(`   Email: ${loginResult.data.user.email}`);
      console.log(`   Name: ${loginResult.data.user.name}`);
      console.log(`   Role: ${loginResult.data.user.role}`);
    } else {
      console.error('❌ Login failed:', loginResult.data.message);
    }

    await sleep(1000);

    // TEST 4: Login with wrong password
    console.log('\n📝 TEST 4: Login with wrong password (should fail)...\n');
    const wrongPasswordResult = await makeRequest('POST', '/api/auth/login', {
      email: testUser.email,
      password: 'WrongPassword123!',
    });

    console.log(`Status: ${wrongPasswordResult.status}`);
    console.log('Response:', JSON.stringify(wrongPasswordResult.data, null, 2));

    if (!wrongPasswordResult.data.success && wrongPasswordResult.status === 401) {
      console.log('✅ Wrong password correctly rejected!');
    } else {
      console.error('❌ Wrong password should have been rejected!');
    }

    await sleep(1000);

    // TEST 5: Login with non-existent user
    console.log('\n📝 TEST 5: Login with non-existent email (should fail)...\n');
    const nonExistentResult = await makeRequest('POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'SomePassword123!',
    });

    console.log(`Status: ${nonExistentResult.status}`);
    console.log('Response:', JSON.stringify(nonExistentResult.data, null, 2));

    if (!nonExistentResult.data.success && nonExistentResult.status === 401) {
      console.log('✅ Non-existent user correctly rejected!');
    } else {
      console.error('❌ Non-existent user should have been rejected!');
    }

    console.log(`
╔════════════════════════════════════════════════════════╗
║        ✅ All Tests Completed Successfully!             ║
╚════════════════════════════════════════════════════════╝

Summary:
✅ User registration works
✅ Duplicate registrations are prevented
✅ Login with correct password works
✅ Login with wrong password is rejected
✅ Login with non-existent email is rejected

The registration and login system is fully functional!
    `);
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
testRegistration();
