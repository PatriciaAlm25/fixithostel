#!/usr/bin/env node
const http = require('http');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

const BASE = 'http://localhost:3000';

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let resp = '';
      res.on('data', (c) => resp += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(resp) }); }
        catch (e) { resolve({ status: res.statusCode, body: resp }); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const email = `persist_test_${Date.now()}@example.com`;
    const payload = { email, password: 'Persist123', name: 'Persist Tester' };
    console.log('Registering user:', email);
    const reg = await makeRequest('/api/auth/register', payload);
    console.log('Register response:', reg.status, reg.body);

    if (!reg.body || !reg.body.success) {
      console.error('Registration failed, aborting test');
      process.exit(1);
    }

    // wait a moment for async Firebase persistence
    await sleep(1500);

    // Now use firebaseAdmin to check for user
    try {
      const { getUserByEmailFromFirebase } = require('./firebaseAdmin');
      const fbUser = await getUserByEmailFromFirebase(email);
      console.log('Firebase lookup result:', fbUser ? fbUser : 'NOT FOUND');
    } catch (err) {
      console.error('Firebase admin lookup failed:', err.message || err);
    }
  } catch (err) {
    console.error('Test error:', err.message || err);
    process.exit(1);
  }
})();
