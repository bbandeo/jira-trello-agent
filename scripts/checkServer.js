// check-server.js
const http = require('http');

const endpoints = [
  { path: '/api/health', method: 'GET' },
  { path: '/api/config', method: 'GET', headers: { 'x-user-id': 'test-user' } },
  { path: '/api/commands/suggestions?partial=sync', method: 'GET' }
];

const baseUrl = 'http://localhost:3000';

async function checkEndpoint(endpoint) {
  const options = {
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json',
      ...endpoint.headers
    }
  };

  return new Promise((resolve, reject) => {
    const url = `${baseUrl}${endpoint.path}`;
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          endpoint: endpoint.path,
          status: res.statusCode,
          response: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function checkServer() {
  console.log('Checking server health...\n');

  for (const endpoint of endpoints) {
    try {
      const result = await checkEndpoint(endpoint);
      console.log(`✅ ${result.endpoint}`);
      console.log(`   Status: ${result.status}`);
      if (result.status === 200) {
        console.log(`   Response: ${result.response.substring(0, 100)}...`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ${endpoint.path}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }
}

checkServer().catch(console.error);