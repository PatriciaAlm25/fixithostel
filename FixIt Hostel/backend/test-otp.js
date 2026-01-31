const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const data = JSON.stringify({
  email: 'patricia07alm@gmail.com',
  otp: '123456'
});

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      console.log('Response:', JSON.parse(body));
    } catch (e) {
      console.log('Response:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.write(data);
req.end();

console.log('Request sent to http://localhost:3000/api/auth/send-otp');
