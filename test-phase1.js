const http = require('node:http');

// Configuration
const API_BASE = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api'
};

const USERS = {
    student: { username: 'student', password: 'student123' },
    teacher: { username: 'teacher', password: 'teacher123' }
};

// Helper: Make HTTP Request
function request(method, endpoint, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            ...API_BASE,
            path: API_BASE.path + endpoint,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

// Test Suite
async function runTests() {
    console.log('🧪 Starting API Verification Tests...\n');
    const results = { passed: 0, failed: 0 };
    const tokens = {};

    // 1. Authentication Tests
    console.log('--- Phase 1: Authentication ---');

    // Test 1.1: Student Login
    try {
        console.log('📝 Test 1.1: Student Login');
        const res = await request('POST', '/auth/login', USERS.student);
        if (res.status === 200 && res.data.token && res.data.user.role === 'STUDENT') {
            console.log('✅ PASS: Student logged in successfully');
            tokens.student = res.data.token;
            results.passed++;
        } else {
            console.error('❌ FAIL: Student login failed', res.data);
            results.failed++;
        }
    } catch (e) {
        console.error('❌ FAIL: Network error', e.message);
        results.failed++;
    }

    // Test 1.2: Teacher Login
    try {
        console.log('\n📝 Test 1.2: Teacher Login');
        const res = await request('POST', '/auth/login', USERS.teacher);
        if (res.status === 200 && res.data.token && res.data.user.role === 'TEACHER') {
            console.log('✅ PASS: Teacher logged in successfully');
            tokens.teacher = res.data.token;
            results.passed++;
        } else {
            console.error('❌ FAIL: Teacher login failed', res.data);
            results.failed++;
        }
    } catch (e) {
        console.error('❌ FAIL: Network error', e.message);
        results.failed++;
    }

    // Test 1.3: Invalid Login
    try {
        console.log('\n📝 Test 1.3: Invalid Login');
        const res = await request('POST', '/auth/login', { username: 'wrong', password: 'bad' });
        if (res.status === 401 || res.status === 400 || res.status === 500) { // Expect error
            console.log('✅ PASS: Invalid login rejected correctly');
            results.passed++;
        } else {
            console.error('❌ FAIL: Invalid login should not succeed', res.status);
            results.failed++;
        }
    } catch (e) {
        console.error('❌ FAIL: Network error', e.message);
        results.failed++;
    }

    console.log(`\n📊 Phase 1 Summary: ${results.passed} Passed, ${results.failed} Failed`);

    // Save tokens for Phase 2 script if needed, or return them
    return tokens;
}

runTests();
