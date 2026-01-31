/**
 * API Integration Testing
 * Test all backend endpoints to verify connection
 */

import backendAPI from './backendAPI.js';

/**
 * Test all API endpoints
 */
export const testAllEndpoints = async () => {
  console.log('🧪 Starting API Integration Tests...\n');
  
  const results = {
    success: [],
    failed: [],
  };

  // Test 1: Health Check
  console.log('1️⃣  Testing Health Check...');
  try {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    console.log('✅ Health Check:', data);
    results.success.push('Health Check');
  } catch (error) {
    console.error('❌ Health Check failed:', error.message);
    results.failed.push('Health Check');
  }

  // Test 2: Test Email
  console.log('\n2️⃣  Testing Email Configuration...');
  try {
    const data = await backendAPI.testEmail();
    console.log('✅ Email Configuration:', data);
    results.success.push('Email Test');
  } catch (error) {
    console.error('❌ Email Test failed:', error.message);
    results.failed.push('Email Test');
  }

  // Test 3: Send OTP
  console.log('\n3️⃣  Testing Send OTP...');
  const testEmail = 'test@example.com';
  try {
    const data = await backendAPI.sendOTP(testEmail);
    console.log('✅ Send OTP:', data);
    results.success.push('Send OTP');
  } catch (error) {
    console.error('❌ Send OTP failed:', error.message);
    results.failed.push('Send OTP');
  }

  // Test 4: Register User
  console.log('\n4️⃣  Testing User Registration...');
  try {
    const registerData = {
      email: testEmail,
      password: 'TestPassword@123',
      name: 'Test User',
      hostel: 'Hostel A',
      block: 'Block 1',
      room_no: '101',
      otp: '123456', // In real scenario, use actual OTP
    };
    const data = await backendAPI.register(registerData);
    console.log('✅ Registration:', data);
    results.success.push('Register');
    
    // Save token for next tests
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    results.failed.push('Register');
  }

  // Test 5: Get Current User
  console.log('\n5️⃣  Testing Get Current User...');
  try {
    const data = await backendAPI.getCurrentUser();
    console.log('✅ Current User:', data);
    results.success.push('Get Current User');
  } catch (error) {
    console.error('❌ Get Current User failed:', error.message);
    results.failed.push('Get Current User');
  }

  // Test 6: Get Issues
  console.log('\n6️⃣  Testing Get All Issues...');
  try {
    const data = await backendAPI.getIssues();
    console.log('✅ Issues:', data);
    results.success.push('Get Issues');
  } catch (error) {
    console.error('❌ Get Issues failed:', error.message);
    results.failed.push('Get Issues');
  }

  // Test 7: Get Lost & Found Items
  console.log('\n7️⃣  Testing Get Lost & Found Items...');
  try {
    const data = await backendAPI.getLostFoundItems();
    console.log('✅ Lost & Found Items:', data);
    results.success.push('Get Lost & Found Items');
  } catch (error) {
    console.error('❌ Get Lost & Found Items failed:', error.message);
    results.failed.push('Get Lost & Found Items');
  }

  // Test 8: Get Announcements
  console.log('\n8️⃣  Testing Get Announcements...');
  try {
    const data = await backendAPI.getAnnouncements();
    console.log('✅ Announcements:', data);
    results.success.push('Get Announcements');
  } catch (error) {
    console.error('❌ Get Announcements failed:', error.message);
    results.failed.push('Get Announcements');
  }

  // Print Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('═'.repeat(50));
  console.log(`✅ Success: ${results.success.length}`);
  results.success.forEach((test) => console.log(`   - ${test}`));
  console.log(`\n❌ Failed: ${results.failed.length}`);
  results.failed.forEach((test) => console.log(`   - ${test}`));
  console.log('═'.repeat(50));

  return results;
};

// Auto-run tests if this file is executed directly
if (import.meta.main) {
  testAllEndpoints();
}

export default testAllEndpoints;
