#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');

const DB_FILE = path.join(__dirname, 'users.db.json');
const BASE = 'http://localhost:3000';

if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);

function req(pathname, data) {
  return new Promise((resolve, reject) => {
    const d = JSON.stringify(data);
    const url = new URL(pathname, BASE);
    const options = { hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } };
    const r = http.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); } catch(e){ resolve({ status: res.statusCode, body }); }
      });
    });
    r.on('error', reject);
    r.write(d);
    r.end();
  });
}

(async ()=>{
  try {
    const user = { email: 'dupe@example.com', password: 'Secure123', name: 'Dupe' };
    console.log('Register #1');
    console.log(await req('/api/auth/register', user));
    console.log('Register #2 (same case)');
    console.log(await req('/api/auth/register', user));
    console.log('Register #3 (different case)');
    const user2 = { ...user, email: 'Dupe@Example.com' };
    console.log(await req('/api/auth/register', user2));
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
})();
