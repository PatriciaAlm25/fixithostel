const bcrypt = require('bcrypt');

// Test the hash from users.db.json
const hash = '$2b$10$ns5Okqmx8WKboud.QErXtuoB4vG1xCeYW41nKpSBd/1uhQE31vWoG';

// Try different common passwords
const passwordsToTest = [
  'password',
  '123456',
  'test@123',
  'password123',
  '1234567890',
  'qwerty',
];

async function testHash() {
  console.log('Testing hash:', hash);
  console.log('');

  for (const pwd of passwordsToTest) {
    try {
      const match = await bcrypt.compare(pwd, hash);
      console.log(`Password: "${pwd}" => ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
    } catch (error) {
      console.log(`Password: "${pwd}" => ERROR: ${error.message}`);
    }
  }
}

testHash();
