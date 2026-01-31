/**
 * Simple login test
 */

const { verifyUserCredentials, findUserByEmail } = require('./database');

async function testLogin() {
  console.log('\n🧪 Testing Login...\n');
  
  // Check if user exists
  const email = 'test@example.com';
  console.log(`📧 Looking for user: ${email}`);
  
  const user = findUserByEmail(email);
  if (user) {
    console.log(`✅ User found:`, {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
    });
  } else {
    console.log(`❌ User not found`);
    return;
  }

  // Try to verify credentials
  console.log(`\n🔐 Verifying credentials with password: test123`);
  try {
    const verifiedUser = await verifyUserCredentials(email, 'test123');
    if (verifiedUser) {
      console.log(`✅ Credentials verified!`, {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
      });
    } else {
      console.log(`❌ Invalid credentials`);
    }
  } catch (error) {
    console.error(`❌ Error during verification:`, error.message);
  }
}

testLogin();
