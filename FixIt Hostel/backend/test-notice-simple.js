/**
 * Simple notice test - Posts a single announcement
 */
const http = require('http');

// Wait a moment before testing
setTimeout(() => {
  const postData = JSON.stringify({
    title: 'System Maintenance',
    description: 'Server maintenance tomorrow at 2 AM',
    content: 'Please note that the system will be down for maintenance',
    userRole: 'management',
    userId: 'mgmt_001',
    userName: 'Admin'
  });

  console.log('\n📢 Posting notice...');
  console.log('Body:', postData);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/notices',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Options:', options);

  const req = http.request(options, (res) => {
    console.log(`Response status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      console.log('Received chunk:', chunk.toString());
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      console.log('\n✅ Test completed');
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
    process.exit(1);
  });

  console.log('Sending request...');
  req.write(postData);
  req.end();
}, 1000);
