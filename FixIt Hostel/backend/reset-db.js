/**
 * Reset users database with test user
 */

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  console.log('🔄 Resetting users database...\n');
  
  // Generate hash for password "test123"
  const password = 'test123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log(`📝 Generated bcrypt hash for password "${password}"`);
  console.log(`   Hash: ${hash}\n`);
  
  const testUsers = {
    users: {
      "user_test_001": {
        "id": "user_test_001",
        "email": "test@example.com",
        "password": hash,
        "name": "Test User",
        "role": "student",
        "registeredAt": new Date().toISOString()
      },
      "user_test_002": {
        "id": "user_test_002",
        "email": "student@example.com",
        "password": hash,
        "name": "Student User",
        "role": "student",
        "hostel": "Hostel A",
        "block": "Block 1",
        "room_no": "101",
        "registeredAt": new Date().toISOString()
      },
      "user_test_003": {
        "id": "user_test_003",
        "email": "caretaker@example.com",
        "password": hash,
        "name": "Caretaker User",
        "role": "caretaker",
        "hostel": "Hostel A",
        "registeredAt": new Date().toISOString()
      },
      "user_test_004": {
        "id": "user_test_004",
        "email": "management@example.com",
        "password": hash,
        "name": "Management User",
        "role": "management",
        "hostel": "Hostel A",
        "registeredAt": new Date().toISOString()
      }
    }
  };
  
  const dbPath = path.join(__dirname, 'users.db.json');
  fs.writeFileSync(dbPath, JSON.stringify(testUsers, null, 2));
  
  console.log('✅ Database reset with test users!');
  console.log('\n📧 Test Credentials:');
  console.log('   Email: test@example.com');
  console.log('   Email: student@example.com');
  console.log('   Email: caretaker@example.com');
  console.log('   Email: management@example.com');
  console.log(`   Password: ${password}`);
}

resetDatabase().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
