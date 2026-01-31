#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
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
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     Testing Login Fix - Registration & Login            ║
╚════════════════════════════════════════════════════════╝
  `);

  try {
    // Test 1: Register a user
    console.log('📝 TEST 1: Register a new user...');
    const registerData = {
      email: 'john@example.com',
      password: 'SecurePass123',
      name: 'John Doe',
      role: 'student',
    };
    const registerResponse = await makeRequest('POST', '/api/auth/register', registerData);
    console.log('Status:', registerResponse.status);
    console.log('Response:', JSON.stringify(registerResponse.data, null, 2));

    if (!registerResponse.data.success) {
      throw new Error('Registration failed: ' + registerResponse.data.message);
    }

    const userId = registerResponse.data.user.id;
    console.log(`✅ User registered successfully! ID: ${userId}\n`);

    // Test 2: Login with correct password
    console.log('🔑 TEST 2: Login with correct password...');
    const loginData = {
      email: 'john@example.com',
      password: 'SecurePass123',
    };
    const loginResponse = await makeRequest('POST', '/api/auth/login', loginData);
    console.log('Status:', loginResponse.status);
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    console.log(`✅ Login successful! User: ${loginResponse.data.user.email}\n`);

    // Test 3: Login with wrong password
    console.log('❌ TEST 3: Login with wrong password (should fail)...');
    const wrongLoginData = {
      email: 'john@example.com',
      password: 'WrongPassword',
    };
    const wrongLoginResponse = await makeRequest('POST', '/api/auth/login', wrongLoginData);
    console.log('Status:', wrongLoginResponse.status);
    console.log('Response:', JSON.stringify(wrongLoginResponse.data, null, 2));

    if (wrongLoginResponse.data.success) {
      throw new Error('Security issue: Login succeeded with wrong password!');
    }

    console.log(`✅ Login correctly rejected with wrong password\n`);

    console.log(`
╔════════════════════════════════════════════════════════╗
║     ✅ All Tests Passed!                               ║
║                                                        ║
║     The login issue has been FIXED!                    ║
║     Users can now register and login successfully.     ║
╚════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error(`
╔════════════════════════════════════════════════════════╗
║     ❌ Test Failed!                                     ║
╚════════════════════════════════════════════════════════╝
    `);
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Wait for server to be ready
setTimeout(runTests, 1000);
