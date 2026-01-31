#!/usr/bin/env node

/**
 * Create Test Users for Demo/Testing
 * This will create some pre-registered users so you can test login
 */

const { registerUser } = require('./database');

async function createTestUsers() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         Creating Test Users for Demo/Testing           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const testUsers = [
    {
      email: 'student@example.com',
      password: 'Student123!',
      name: 'Demo Student',
      role: 'student',
      hostel: 'Hostel A',
      block: 'Block 1',
      room_no: '101',
      department: 'CSE',
      college: 'Test College',
      year: '1',
      dob: '2005-01-15',
      age: 19,
      email_verified: true,
    },
    {
      email: 'caretaker@example.com',
      password: 'Caretaker123!',
      name: 'Demo Caretaker',
      role: 'caretaker',
      hostel: 'Hostel A',
      specialization: 'Plumbing',
      email_verified: true,
    },
    {
      email: 'admin@example.com',
      password: 'Admin123!',
      name: 'Demo Admin',
      role: 'management',
      hostel: 'Hostel A',
      email_verified: true,
    },
  ];

  for (const userData of testUsers) {
    try {
      console.log(`📝 Creating user: ${userData.email}`);
      const user = await registerUser(userData);
      console.log(`✅ Created: ${user.email} (${user.role})`);
      console.log(`   ID: ${user.id}\n`);
    } catch (error) {
      console.log(`⚠️ User already exists: ${userData.email}\n`);
    }
  }

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         ✅ Test Users Ready for Login Testing          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('📋 TEST CREDENTIALS:\n');
  console.log('👨‍🎓 Student Account:');
  console.log('   Email: student@example.com');
  console.log('   Password: Student123!\n');

  console.log('🔧 Caretaker Account:');
  console.log('   Email: caretaker@example.com');
  console.log('   Password: Caretaker123!\n');

  console.log('👨‍💼 Admin Account:');
  console.log('   Email: admin@example.com');
  console.log('   Password: Admin123!\n');
}

createTestUsers().catch(console.error);
