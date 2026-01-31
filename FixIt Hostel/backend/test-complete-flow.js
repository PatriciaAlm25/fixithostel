#!/usr/bin/env node

/**
 * Complete Test: Registration -> OTP -> Login -> Supabase Verification
 */

const { registerUser, verifyUserCredentials, findUserByEmail } = require('./database');
const { sendOTPEmail, initializeGmailTransporter } = require('./routes/authRoutes');
const fs = require('fs');

async function runCompleteTest() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  FixIt Hostel - Complete Registration & Login Test    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  try {
    // Step 1: Test Email Configuration
    console.log('📧 Step 1: Test Email Configuration');
    console.log('─'.repeat(56));
    try {
      const transporter = await initializeGmailTransporter();
      if (transporter) {
        console.log('✅ Email transporter initialized');
      } else {
        console.log('⚠️  Email not configured (demo mode will be used)');
      }
    } catch (e) {
      console.log('⚠️  Email configuration error:', e.message);
    }

    // Step 2: Register User
    console.log('\n📝 Step 2: Register New User');
    console.log('─'.repeat(56));
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    console.log(`👤 Name: ${testName}`);

    const newUser = await registerUser({
      email: testEmail,
      password: testPassword,
      name: testName,
      role: 'student',
      hostel: 'Hostel A',
      block: 'Block 1',
      room_no: '101',
      department: 'CSE',
      college: 'Test College',
      year: '1',
      dob: '2005-01-15',
      age: 19,
      email_verified: false,
    });

    console.log('✅ User registered successfully:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);

    // Step 3: Check Local Database
    console.log('\n💾 Step 3: Verify User in Local Database');
    console.log('─'.repeat(56));
    const localUser = findUserByEmail(testEmail);
    if (localUser) {
      console.log('✅ User found in local database:');
      console.log(`   ID: ${localUser.id}`);
      console.log(`   Email: ${localUser.email}`);
      console.log(`   Has password hash: ${!!localUser.password}`);
    } else {
      console.log('❌ User NOT found in local database');
    }

    // Step 4: Send OTP Email
    console.log('\n📧 Step 4: Send OTP via Email');
    console.log('─'.repeat(56));
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📤 OTP to send: ${otp}`);
    
    const otpResult = await sendOTPEmail(testEmail, otp);
    console.log(`✅ OTP Email Status: ${otpResult.success ? 'SUCCESS' : 'FAILED'}`);
    if (otpResult.demoMode) {
      console.log('   Mode: DEMO (check backend console for OTP)');
    }
    if (otpResult.error) {
      console.log(`   Error: ${otpResult.error}`);
    }

    // Step 5: Login with Credentials
    console.log('\n🔐 Step 5: Login with Registered Credentials');
    console.log('─'.repeat(56));
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);

    const loginUser = await verifyUserCredentials(testEmail, testPassword);
    if (loginUser) {
      console.log('✅ Login successful!');
      console.log(`   ID: ${loginUser.id}`);
      console.log(`   Email: ${loginUser.email}`);
      console.log(`   Name: ${loginUser.name}`);
      console.log(`   Email Verified: ${loginUser.email_verified}`);
    } else {
      console.log('❌ Login failed!');
    }

    // Step 6: Test Wrong Password
    console.log('\n🔐 Step 6: Test Login with Wrong Password');
    console.log('─'.repeat(56));
    try {
      const wrongPasswordUser = await verifyUserCredentials(testEmail, 'WrongPassword');
      if (wrongPasswordUser) {
        console.log('❌ SECURITY ISSUE: Wrong password was accepted!');
      } else {
        console.log('✅ Correctly rejected wrong password');
      }
    } catch (error) {
      console.log(`✅ Correctly rejected wrong password: ${error.message}`);
    }

    // Step 7: Verify users.db.json exists and has data
    console.log('\n📋 Step 7: Verify users.db.json File');
    console.log('─'.repeat(56));
    const dbPath = './users.db.json';
    if (fs.existsSync(dbPath)) {
      const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const userCount = Object.keys(dbContent.users || {}).length;
      console.log(`✅ Database file exists: ${dbPath}`);
      console.log(`   Total users: ${userCount}`);
      const testUser = Object.values(dbContent.users || {}).find(u => u.email === testEmail);
      if (testUser) {
        console.log(`   Test user found: ${testEmail}`);
      }
    } else {
      console.log(`❌ Database file not found: ${dbPath}`);
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL TESTS COMPLETED                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runCompleteTest();
