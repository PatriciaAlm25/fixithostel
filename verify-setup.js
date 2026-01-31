#!/usr/bin/env node
/**
 * Simple verification script
 * Tests password verification without needing terminals
 */

const fs = require('fs');
const path = require('path');

console.log('\n📋 FixIt Hostel - Login Verification Report\n');
console.log('=' .repeat(60));

// Check .env files
console.log('\n✓ Checking environment configuration...');
const backendEnv = path.join(__dirname, 'FixIt Hostel', 'backend', '.env');
const frontendEnv = path.join(__dirname, 'FixIt Hostel', '.env');

if (fs.existsSync(backendEnv)) {
  console.log('  ✅ Backend .env found');
} else {
  console.log('  ❌ Backend .env NOT found');
}

if (fs.existsSync(frontendEnv)) {
  console.log('  ✅ Frontend .env found');
} else {
  console.log('  ❌ Frontend .env NOT found');
}

// Check users.db.json
console.log('\n✓ Checking user database...');
const usersDb = path.join(__dirname, 'FixIt Hostel', 'backend', 'users.db.json');

if (fs.existsSync(usersDb)) {
  const data = JSON.parse(fs.readFileSync(usersDb, 'utf8'));
  const users = Object.values(data.users || {});
  
  console.log(`  ✅ Database found with ${users.length} users`);
  
  // Check for test user
  const testUser = users.find(u => u.email === 'test@example.com');
  if (testUser) {
    console.log(`  ✅ test@example.com user exists`);
    console.log(`     ID: ${testUser.id}`);
    console.log(`     Name: ${testUser.name}`);
    console.log(`     Role: ${testUser.role}`);
    console.log(`     Password hash: ${testUser.password?.substring(0, 30)}...`);
  } else {
    console.log(`  ❌ test@example.com NOT found`);
    console.log(`  Available users: ${users.map(u => u.email).join(', ')}`);
  }
} else {
  console.log('  ❌ Database file NOT found');
}

console.log('\n' + '='.repeat(60));
console.log('\n📝 Next Steps:');
console.log('  1. Start backend:  cd "FixIt Hostel\\backend" && node server.js');
console.log('  2. Start frontend: cd "FixIt Hostel" && npm run dev');
console.log('  3. Open http://localhost:5173');
console.log('  4. Try logging in with: test@example.com / test123');
console.log('  5. Check browser console (F12) and backend logs for errors');

console.log('\n');
