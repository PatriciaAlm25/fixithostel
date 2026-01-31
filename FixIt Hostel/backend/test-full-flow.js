/**
 * Simulate the full login flow in the browser
 */

async function testFullLoginFlow() {
  console.log('\n🧪 Testing Full Login Flow (Simulating Browser)\n');
  
  const API_URL = 'http://localhost:3000/api';
  const email = 'test@example.com';
  const password = 'test123';
  
  try {
    // Step 1: Call backend login
    console.log('📤 Step 1: Calling backend login API...');
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log(`   Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Received login response:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Message: ${data.message}`);
    console.log(`   User: ${data.user?.email}`);
    console.log(`   Token: ${data.token ? 'Yes' : 'No'}`);
    
    if (!data.user) {
      throw new Error('No user in response');
    }
    
    if (!data.token) {
      throw new Error('No token in response');
    }
    
    // Step 2: Save to localStorage (simulating authContext)
    console.log('\n💾 Step 2: Saving to localStorage...');
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('authToken', data.token);
    console.log('✅ Saved user and token to localStorage');
    
    // Step 3: Verify can be retrieved
    console.log('\n✅ Step 3: Verifying localStorage...');
    const savedUser = JSON.parse(localStorage.getItem('user'));
    console.log(`   User retrieved: ${savedUser?.email}`);
    
    console.log('\n✅ FULL LOGIN FLOW COMPLETE!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testFullLoginFlow();
