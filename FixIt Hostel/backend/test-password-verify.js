/**
 * Direct test of password verification
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const bcrypt = require('bcrypt');
const { findUserByEmail, verifyUserCredentials } = require('./database');

async function testPasswordVerification() {
  console.log('\n🧪 Testing Password Verification\n');
  
  const email = 'test@example.com';
  const correctPassword = 'test123';
  const wrongPassword = 'wrongpassword';
  const expectedHash = '$2b$10$ns5Okqmx8WKboud.QErXtuoB4vG1xCeYW41nKpSBd/1uhQE31vWoG';
  
  try {
    // Step 1: Find user
    console.log('📝 Step 1: Finding user locally...');
    const user = findUserByEmail(email);
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log(`✅ Found user: ${user.email}`);
    console.log(`   Password hash: ${user.password?.substring(0, 20)}...`);
    
    // Step 2: Test bcrypt directly
    console.log('\n📝 Step 2: Testing bcrypt.compare() directly...');
    
    const correctMatch = await bcrypt.compare(correctPassword, user.password);
    console.log(`   Password "${correctPassword}": ${correctMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    
    const wrongMatch = await bcrypt.compare(wrongPassword, user.password);
    console.log(`   Password "${wrongPassword}": ${wrongMatch ? '❌ UNEXPECTED MATCH' : '✅ NO MATCH (expected)'}`);
    
    // Step 3: Test verifyUserCredentials
    console.log('\n📝 Step 3: Testing verifyUserCredentials()...');
    
    try {
      const verifiedUser = await verifyUserCredentials(email, correctPassword);
      if (verifiedUser) {
        console.log(`✅ Verification successful for: ${verifiedUser.email}`);
      } else {
        console.log('❌ Verification failed - returned null');
      }
    } catch (error) {
      console.log(`❌ Verification failed with error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPasswordVerification();
