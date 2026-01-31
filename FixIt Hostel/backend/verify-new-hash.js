const bcrypt = require('bcrypt');

// Test the new hash
const hash = '$2b$10$CRcZpMcPsyJ2h841N4oYVOvgSASby8aIUdApMaFLAC/Qx5bC0dmna';
const password = 'password123';

async function testNewHash() {
  console.log('Testing new hash:', hash);
  console.log('Password to test:', password);
  console.log('');

  try {
    const match = await bcrypt.compare(password, hash);
    console.log(`Result: ${match ? '✅ MATCH - Password works!' : '❌ NO MATCH'}`);
  } catch (error) {
    console.log(`ERROR: ${error.message}`);
  }
}

testNewHash();
