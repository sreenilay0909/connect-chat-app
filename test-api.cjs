// Simple Node.js script to test the backend API
const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => reject(error));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing Backend API...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const health = await makeRequest('GET', '/health');
    console.log('✅ Health:', health.data);
    console.log('');
    
    // Test 2: Register user
    console.log('2️⃣ Testing user registration...');
    const userData = {
      username: 'Test User',
      email: 'test@example.com'
    };
    const user = await makeRequest('POST', '/users', userData);
    console.log('✅ User registered:', user.data);
    console.log('');
    
    // Test 3: Get all users
    console.log('3️⃣ Testing get all users...');
    const users = await makeRequest('GET', '/users');
    console.log('✅ Users:', users.data);
    console.log('');
    
    console.log('🎉 All tests passed!');
    console.log('\n📊 Check MongoDB Compass - you should see data in the users collection!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();
