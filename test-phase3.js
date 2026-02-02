const http = require('node:http');

const API_BASE = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api'
};

const USERS = {
    teacher: { username: 'teacher', password: 'teacher123' }
};

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
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runPhase3() {
    console.log('🧪 Starting Phase 3: Teacher Dashboard Tests...\n');
    const results = { passed: 0, failed: 0 };
    let token = '';

    // 0. Login
    try {
        const res = await request('POST', '/auth/login', USERS.teacher);
        console.log('[DEBUG] Login Status:', res.status);
        console.log('[DEBUG] Login Data:', JSON.stringify(res.data));

        token = res.data.token;
        if (!token) {
            console.error('❌ FATAL: No token received despite 200 OK');
            return;
        }
        console.log('✅ Setup: Teacher Login successful, token length:', token.length);
    } catch (e) {
        console.error('❌ FATAL: Login failed', e);
        return;
    }

    // 1. Dashboard Overview
    try {
        console.log('\n📝 Test 3.1: Get Dashboard Overview');
        const res = await request('GET', '/teacher/dashboard', null, token);
        if (res.status === 200 && res.data.students) {
            console.log(`✅ PASS: Dashboard loaded. Active students: ${res.data.activeCount}`);

            // Verify student status logic
            const student = res.data.students.find(s => s.student.username === 'student');
            if (student) {
                console.log(`   - Verified student 'student' status: ${student.activityStatus}`);
            }
            results.passed++;
        } else {
            console.error('❌ FAIL: Dashboard failed to load', res.data);
            results.failed++;
        }
    } catch (e) { console.error(e); results.failed++; }

    // 2. Student Detail
    try {
        console.log('\n📝 Test 3.2: Get Student Details');
        // Need a user ID first - let's cheat and use the one from dashboard
        const dbRes = await request('GET', '/teacher/dashboard', null, token);
        const student = dbRes.data.students[0];

        if (student) {
            const res = await request('GET', `/teacher/student/${student.student.id}`, null, token);
            if (res.status === 200 && res.data.activityLogs) {
                console.log(`✅ PASS: Student detail loaded. Logs: ${res.data.activityLogs.length}`);
                results.passed++;
            } else {
                console.error('❌ FAIL: Student detail failed', res.data);
                results.failed++;
            }
        } else {
            console.log('⚠️ SKIP: No students found to test detail view');
        }
    } catch (e) { console.error(e); results.failed++; }

    // 3. Analytics
    try {
        console.log('\n📝 Test 3.3: Get Analytics');
        const res = await request('GET', '/teacher/analytics', null, token);
        if (res.status === 200 && res.data.taskAnalytics) {
            console.log('✅ PASS: Analytics loaded');
            results.passed++;
        } else {
            console.error('❌ FAIL: Analytics failed', res.data);
            results.failed++;
        }
    } catch (e) { console.error(e); results.failed++; }

    console.log(`\n📊 Phase 3 Summary: ${results.passed} Passed, ${results.failed} Failed`);
}

runPhase3();
