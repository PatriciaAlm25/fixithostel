/**
 * Direct API test script
 */

const API_URL = 'http://localhost:3000/api';

async function testLogin() {
  console.log('\n🧪 Testing Direct Login API\n');
  
  try {
    console.log('📤 Sending login request...');
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    
    console.log(`📥 Response status: ${response.status}`);
    console.log(`📥 Response headers:`, response.headers);
    
    const data = await response.json();
    console.log('\n✅ Response data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok && data.token) {
      console.log('\n✅ Login successful!');
      console.log(`   User: ${data.user?.name} (${data.user?.email})`);
      console.log(`   Token: ${data.token.substring(0, 20)}...`);
      console.log(`   Role: ${data.user?.role}`);
    } else {
      console.log('\n❌ Login failed');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testLogin();
