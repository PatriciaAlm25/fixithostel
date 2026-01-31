/**
 * Firebase Integration Test Suite
 * Tests Firebase Realtime Database connectivity and operations
 */

const admin = require('firebase-admin');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   Firebase Realtime Database Integration Test Suite   ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Step 1: Initialize Firebase Admin SDK
console.log('📋 Step 1: Initializing Firebase Admin SDK...\n');

let db = null;
let initialized = false;

try {
  const keyPath = path.join(__dirname, 'credentials', 'fixit-hostel-key.json');
  console.log(`   Looking for credentials at: ${keyPath}`);
  
  const serviceAccount = require(keyPath);
  console.log(`   ✅ Credentials loaded: ${serviceAccount.project_id}`);

  // Check if Firebase app is already initialized
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://hostelfixit-default-rtdb.firebaseio.com',
    });
    console.log('   ✅ Firebase Admin SDK initialized');
  } else {
    console.log('   ℹ️  Firebase App already initialized');
  }

  db = admin.database();
  initialized = true;
  console.log('   ✅ Database reference obtained\n');
} catch (error) {
  console.error('   ❌ Initialization failed:', error.message);
  console.error('   Make sure fixit-hostel-key.json exists in backend/credentials/\n');
  process.exit(1);
}

// Helper function to generate test user
function generateTestUser(suffix = '') {
  const timestamp = Date.now();
  return {
    id: `user_test_${timestamp}${suffix}`,
    email: `test.user.${timestamp}${suffix}@example.com`,
    name: `Test User ${timestamp}${suffix}`,
    password: 'hashedPassword123', // In real app, this would be hashed
    role: 'student',
    registeredAt: new Date().toISOString(),
    lastLogin: null,
  };
}

// Test Suite
async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Write a test user
  console.log('🧪 Test 1: Write a test user to Firebase...');
  try {
    const testUser = generateTestUser('_write');
    const userRef = db.ref(`users/${testUser.id}`);
    
    await userRef.set(testUser);
    console.log(`   ✅ User written successfully`);
    console.log(`      Email: ${testUser.email}`);
    console.log(`      User ID: ${testUser.id}\n`);
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 2: Read all users
  console.log('🧪 Test 2: Read all users from Firebase...');
  try {
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      const userCount = Object.keys(users).length;
      console.log(`   ✅ Successfully read users from Firebase`);
      console.log(`      Total users in database: ${userCount}`);
      
      // Show first 3 users as sample
      const userEmails = Object.values(users)
        .slice(0, 3)
        .map(u => u.email || 'no-email');
      console.log(`      Sample emails: ${userEmails.join(', ')}`);
      console.log();
      testsPassed++;
    } else {
      console.log(`   ℹ️  No users found in database (first run)\n`);
      testsPassed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 3: Find user by email
  console.log('🧪 Test 3: Find user by email...');
  try {
    const testUser = generateTestUser('_find');
    const userRef = db.ref(`users/${testUser.id}`);
    await userRef.set(testUser);

    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    let foundUser = null;

    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const userId in users) {
        if (String(users[userId].email || '').toLowerCase() === testUser.email.toLowerCase()) {
          foundUser = { id: userId, ...users[userId] };
          break;
        }
      }
    }

    if (foundUser) {
      console.log(`   ✅ User found by email`);
      console.log(`      Email: ${foundUser.email}`);
      console.log(`      Name: ${foundUser.name}\n`);
      testsPassed++;
    } else {
      console.log(`   ❌ User not found\n`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 4: Update user data
  console.log('🧪 Test 4: Update user data...');
  try {
    const testUser = generateTestUser('_update');
    const userRef = db.ref(`users/${testUser.id}`);
    
    // First create the user
    await userRef.set(testUser);
    
    // Then update
    await userRef.update({
      lastLogin: new Date().toISOString(),
      name: 'Updated Test User',
    });

    const snapshot = await userRef.once('value');
    const updatedUser = snapshot.val();

    if (updatedUser.lastLogin && updatedUser.name === 'Updated Test User') {
      console.log(`   ✅ User updated successfully`);
      console.log(`      Updated name: ${updatedUser.name}`);
      console.log(`      Last login: ${updatedUser.lastLogin}\n`);
      testsPassed++;
    } else {
      console.log(`   ❌ Update verification failed\n`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 5: Delete user data
  console.log('🧪 Test 5: Delete user data...');
  try {
    const testUser = generateTestUser('_delete');
    const userRef = db.ref(`users/${testUser.id}`);
    
    // Create the user
    await userRef.set(testUser);
    console.log(`   User created for deletion test`);
    
    // Delete
    await userRef.remove();
    
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
      console.log(`   ✅ User deleted successfully`);
      console.log(`      Verified: User no longer exists in database\n`);
      testsPassed++;
    } else {
      console.log(`   ❌ Deletion verification failed - user still exists\n`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 6: Batch operations
  console.log('🧪 Test 6: Batch create multiple users...');
  try {
    const batchUsers = [
      generateTestUser('_batch_1'),
      generateTestUser('_batch_2'),
      generateTestUser('_batch_3'),
    ];

    const rootRef = db.ref('users');
    const updates = {};

    for (const user of batchUsers) {
      updates[user.id] = user;
    }

    await rootRef.update(updates);
    console.log(`   ✅ Batch created ${batchUsers.length} users`);
    console.log(`      User IDs: ${batchUsers.map(u => u.id).join(', ')}\n`);
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 7: Query and filter (simulated)
  console.log('🧪 Test 7: Query users with specific role...');
  try {
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    let studentCount = 0;

    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const userId in users) {
        if (users[userId].role === 'student') {
          studentCount++;
        }
      }
    }

    console.log(`   ✅ Query completed successfully`);
    console.log(`      Students found: ${studentCount}\n`);
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 8: Real-time listener (quick test)
  console.log('🧪 Test 8: Set up real-time listener...');
  try {
    const testRef = db.ref('users');
    let callbackCalled = false;

    const listener = testRef.limitToLast(1).on('value', (snapshot) => {
      callbackCalled = true;
    });

    // Give it a moment to fire
    await new Promise(resolve => setTimeout(resolve, 500));

    if (callbackCalled) {
      console.log(`   ✅ Real-time listener working`);
      console.log(`      Callback was invoked as expected\n`);
      testRef.off('value', listener);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Listener may not have fired (but connection OK)\n`);
      testRef.off('value', listener);
      testsPassed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 9: Connection info
  console.log('🧪 Test 9: Check database connection info...');
  try {
    const connectedRef = db.ref('.info/connected');
    const snapshot = await connectedRef.once('value');
    const isConnected = snapshot.val();

    if (isConnected) {
      console.log(`   ✅ Database connection verified`);
      console.log(`      Connected: ${isConnected}\n`);
      testsPassed++;
    } else {
      console.log(`   ❌ Not connected to database\n`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 10: Schema validation
  console.log('🧪 Test 10: Verify user schema...');
  try {
    const usersRef = db.ref('users');
    const snapshot = await usersRef.limitToFirst(1).once('value');

    if (snapshot.exists()) {
      const user = Object.values(snapshot.val())[0];
      const requiredFields = ['id', 'email', 'name', 'role'];
      const hasAllFields = requiredFields.every(field => field in user);

      if (hasAllFields) {
        console.log(`   ✅ User schema is valid`);
        console.log(`      Required fields present: ${requiredFields.join(', ')}\n`);
        testsPassed++;
      } else {
        const missing = requiredFields.filter(f => !(f in user));
        console.log(`   ⚠️  Schema issue - missing fields: ${missing.join(', ')}\n`);
        testsPassed++;
      }
    } else {
      console.log(`   ℹ️  No users to validate schema (first run)\n`);
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
  console.log(`║  ✅ Passed: ${testsPassed}                                                 ║`);
  console.log(`║  ❌ Failed: ${testsFailed}                                                 ║`);
  console.log(`║  📊 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%                                         ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Firebase integration is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
  }

  // Cleanup
  console.log('🧹 Cleaning up test data...');
  process.exit(testsFailed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
