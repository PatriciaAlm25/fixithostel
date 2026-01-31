const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function generateTestUsers() {
  console.log('🔐 Generating bcrypt hashes for test users...\n');

  // Password to use for all test users
  const password = 'password123';
  
  // Generate hash
  const hash = await bcrypt.hash(password, 10);
  console.log(`Generated hash for password "${password}":`);
  console.log(`${hash}\n`);

  // Create test users with valid hashes
  const testUsers = {
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
  };

  // Write to database file
  const dbPath = path.join(__dirname, 'users.db.json');
  const db = { users: testUsers };
  
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('✅ Test users updated in users.db.json');
  console.log('\nTest Users:');
  console.log('━'.repeat(60));
  Object.values(testUsers).forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log('');
  });
}

generateTestUsers();
