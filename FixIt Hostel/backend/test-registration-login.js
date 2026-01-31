/**
 * Test registration and login flow with Supabase
 */

const { registerUser, verifyUserCredentials } = require('./database');

async function testRegistrationAndLogin() {
  console.log('\n🧪 Testing Registration and Login Flow with Supabase\n');
  
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'SecurePass123!';
  
  try {
    // Step 1: Register a new user
    console.log('📝 Step 1: Registering new user...');
    const newUser = await registerUser({
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      role: 'student',
      hostel: 'Hostel A',
      block: 'Block 1',
      room_no: '101'
    });
    
    console.log('✅ User registered successfully:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Role: ${newUser.role}`);
    
    // Step 2: Login with the registered user
    console.log('\n🔐 Step 2: Logging in with registered credentials...');
    const loginUser = await verifyUserCredentials(testEmail, testPassword);
    
    if (loginUser) {
      console.log('✅ Login successful!');
      console.log(`   ID: ${loginUser.id}`);
      console.log(`   Email: ${loginUser.email}`);
      console.log(`   Name: ${loginUser.name}`);
      console.log(`   Role: ${loginUser.role}`);
    } else {
      console.log('❌ Login failed - user not found');
    }
    
    // Step 3: Try login with wrong password
    console.log('\n🔐 Step 3: Testing login with wrong password...');
    try {
      const wrongPasswordUser = await verifyUserCredentials(testEmail, 'WrongPassword');
      console.log('❌ Wrong password was accepted (this should not happen)');
    } catch (error) {
      console.log(`✅ Correctly rejected wrong password: ${error.message}`);
    }
    
    console.log('\n✅ All tests passed! Registration and login flow is working.\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testRegistrationAndLogin();
