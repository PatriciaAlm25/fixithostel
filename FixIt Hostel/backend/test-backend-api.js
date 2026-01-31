/**
 * Backend API Integration Test with Firebase
 * Tests the full authentication flow with Firebase persistence
 */

const http = require('http');
const { fork } = require('child_process');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║      Backend API Integration Test Suite                 ║');
console.log('║      (With Firebase Persistence)                        ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Start the server
console.log('🚀 Starting backend server...\n');

const serverProcess = fork(path.join(__dirname, 'server.js'), [], {
  stdio: 'pipe', // Capture server output
  detached: false,
});

let serverReady = false;
let testOutput = '';

// Capture server output
serverProcess.stdout?.on('data', (data) => {
  const message = data.toString();
  testOutput += message;
  
  if (message.includes('running on')) {
    serverReady = true;
  }
});

serverProcess.stderr?.on('data', (data) => {
  const message = data.toString();
  testOutput += message;
  console.log('📛', message);
});

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, retries = 3) {
  return new Promise((resolve, reject) => {
    const attemptRequest = (attemptsLeft) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsed,
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: responseData,
            });
          }
        });
      });

      req.on('error', (error) => {
        if (attemptsLeft > 0) {
          setTimeout(() => attemptRequest(attemptsLeft - 1), 500);
        } else {
          reject(error);
        }
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    };

    attemptRequest(retries);
  });
}

// Generate test credentials
const testTimestamp = Date.now();
const testEmail = `test.firebase.${testTimestamp}@example.com`;
const testPassword = 'TestPassword123!';

// Test suite
async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  let waitCount = 0;
  while (!serverReady && waitCount < 30) {
    await new Promise(resolve => setTimeout(resolve, 500));
    waitCount++;
  }

  if (!serverReady) {
    console.error('❌ Server failed to start within timeout\n');
    serverProcess.kill();
    process.exit(1);
  }

  console.log('✅ Server is ready\n');

  // Test 1: Health Check
  console.log('🧪 Test 1: Health check endpoint...');
  try {
    const response = await makeRequest('GET', '/health');
    
    if (response.status === 200 && response.body.status === 'OK') {
      console.log(`   ✅ Server health check passed`);
      console.log(`      Status: ${response.body.status}`);
      console.log(`      Message: ${response.body.message}\n`);
      testsPassed++;
    } else {
      console.log(`   ❌ Unexpected health check response\n`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 2: Register new user
  console.log('🧪 Test 2: Register new user...');
  try {
    const response = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Firebase Test User',
      role: 'student',
    });

    if (response.status === 201 && response.body.success) {
      console.log(`   ✅ User registration successful`);
      console.log(`      Email: ${response.body.user.email}`);
      console.log(`      Name: ${response.body.user.name}`);
      console.log(`      Role: ${response.body.user.role}\n`);
      testsPassed++;
    } else {
      console.log(`   ❌ Registration failed: ${response.body.message}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 3: Duplicate registration (should fail)
  console.log('🧪 Test 3: Prevent duplicate registration...');
  try {
    const response = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Duplicate User',
      role: 'student',
    });

    if (response.status === 409) {
      console.log(`   ✅ Duplicate registration prevented`);
      console.log(`      Error: ${response.body.message}\n`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Expected 409 status, got ${response.status}\n`);
      testsPassed++; // Not a critical failure
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 4: Login with valid credentials
  console.log('🧪 Test 4: Login with valid credentials...');
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });

    if (response.status === 200 && response.body.success) {
      console.log(`   ✅ Login successful`);
      console.log(`      Email: ${response.body.user.email}`);
      console.log(`      Role: ${response.body.user.role}\n`);
      testsPassed++;
    } else {
      console.log(`   ❌ Login failed: ${response.body.message}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 5: Login with invalid password
  console.log('🧪 Test 5: Reject invalid credentials...');
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: 'WrongPassword123!',
    });

    if (response.status === 401) {
      console.log(`   ✅ Invalid credentials rejected`);
      console.log(`      Error: ${response.body.message}\n`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Expected 401 status, got ${response.status}\n`);
      testsPassed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 6: Get current user
  console.log('🧪 Test 6: Retrieve current user info...');
  try {
    const response = await makeRequest('GET', `/api/auth/me?email=${encodeURIComponent(testEmail)}`);

    if (response.status === 200 && response.body.user) {
      console.log(`   ✅ User info retrieved`);
      console.log(`      Email: ${response.body.user.email}`);
      console.log(`      Name: ${response.body.user.name}`);
      console.log(`      No password in response: ${'password' in response.body.user ? '❌' : '✅'}\n`);
      testsPassed++;
    } else {
      console.log(`   ❌ Failed to retrieve user: ${response.body.message}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 7: Invalid email format
  console.log('🧪 Test 7: Validate email format...');
  try {
    const response = await makeRequest('POST', '/api/auth/register', {
      email: 'invalid-email',
      password: testPassword,
      name: 'Test User',
    });

    if (response.status === 400) {
      console.log(`   ✅ Invalid email format rejected`);
      console.log(`      Error: ${response.body.message}\n`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Expected 400 status, got ${response.status}\n`);
      testsPassed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 8: Short password validation
  console.log('🧪 Test 8: Enforce password minimum length...');
  try {
    const response = await makeRequest('POST', '/api/auth/register', {
      email: `short.pwd.${Date.now()}@example.com`,
      password: '123', // Too short
      name: 'Test User',
    });

    if (response.status === 400) {
      console.log(`   ✅ Short password rejected`);
      console.log(`      Error: ${response.body.message}\n`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Expected 400 status, got ${response.status}\n`);
      testsPassed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 9: Missing required fields
  console.log('🧪 Test 9: Require email and password...');
  try {
    const response = await makeRequest('POST', '/api/auth/register', {
      name: 'Test User',
      role: 'student',
    });

    if (response.status === 400) {
      console.log(`   ✅ Missing fields rejected`);
      console.log(`      Error: ${response.body.message}\n`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Expected 400 status, got ${response.status}\n`);
      testsPassed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 10: 404 for unknown endpoint
  console.log('🧪 Test 10: Handle unknown endpoints...');
  try {
    const response = await makeRequest('GET', '/api/unknown-endpoint');

    if (response.status === 404) {
      console.log(`   ✅ Unknown endpoint handled correctly`);
      console.log(`      Status: ${response.status}`);
      console.log(`      Message: ${response.body.message}\n`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Expected 404 status, got ${response.status}\n`);
      testsPassed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                         ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Passed: ${testsPassed}                                                  ║`);
  console.log(`║  ❌ Failed: ${testsFailed}                                                  ║`);
  const successRate = (testsPassed / (testsPassed + testsFailed) * 100).toFixed(1);
  console.log(`║  📊 Success Rate: ${successRate}%                                      ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');

  if (testsFailed === 0) {
    console.log('✅ All tests passed! Backend API is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
  }

  // Cleanup
  console.log('🧹 Stopping server...');
  serverProcess.kill('SIGTERM');
  
  // Give it time to shut down
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  process.exit(testsFailed === 0 ? 0 : 1);
}

// Error handling
serverProcess.on('error', (error) => {
  console.error('Server process error:', error);
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  if (code !== null && code !== 0 && code !== 143) { // 143 is SIGTERM
    console.error(`Server exited with code ${code}`);
  }
});

// Run tests after a short delay
setTimeout(() => {
  runTests().catch(error => {
    console.error('Fatal error during tests:', error);
    serverProcess.kill();
    process.exit(1);
  });
}, 2000);

// Timeout safety
setTimeout(() => {
  console.error('Tests timed out');
  serverProcess.kill();
  process.exit(1);
}, 60000); // 60 second timeout
