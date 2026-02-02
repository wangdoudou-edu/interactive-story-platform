const http = require('node:http');

const API_BASE = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api'
};

const USERS = {
    student: { username: 'student', password: 'student123' }
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

async function runPhase2() {
    console.log('🧪 Starting Phase 2: Student Workflow Tests...\n');
    const results = { passed: 0, failed: 0 };
    let token = '';
    let conversationId = '';
    let aiConfigId = '';
    let messageId = '';
    let projectId = '';

    // 0. Login
    try {
        const res = await request('POST', '/auth/login', USERS.student);
        token = res.data.token;
        console.log('✅ Setup: Login successful');
    } catch (e) {
        console.error('❌ FATAL: Login failed', e);
        return;
    }

    // 1. Get AI configs
    try {
        console.log('\n📝 Test 2.1: Get AI Configs');
        const res = await request('GET', '/ai/configs', null, token);
        if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
            console.log(`✅ PASS: Found ${res.data.length} AI configs`);
            aiConfigId = res.data[0].id;
            results.passed++;
        } else {
            console.error('❌ FAIL: No AI configs found', res.data);
            results.failed++;
        }
    } catch (e) { console.error(e); results.failed++; }

    // 2. Create Conversation
    try {
        console.log('\n📝 Test 2.2: Create Conversation');
        const res = await request('POST', '/conversations', { title: 'Test Conv' }, token);
        if (res.status === 201 && res.data.id) {
            conversationId = res.data.id;
            console.log('✅ PASS: Conversation created:', conversationId);
            results.passed++;
        } else {
            console.error('❌ FAIL: Create conversation failed', res.data);
            results.failed++;
        }
    } catch (e) { console.error(e); results.failed++; }

    // 3. Send Message (Mock)
    if (conversationId && aiConfigId) {
        try {
            console.log('\n📝 Test 2.3: Send Message');
            // Using a simplified request payload assuming backend handles formatting
            const payload = {
                content: 'Hello AI',
                aiConfigIds: [aiConfigId]
            };
            const res = await request('POST', `/conversations/${conversationId}/messages`, payload, token);

            if (res.status === 201 && res.data.assistantMessages) {
                console.log('✅ PASS: Message sent and AI replied');
                // Get the AI message ID for annotation test
                messageId = res.data.assistantMessages[0].id;
                results.passed++;
            } else {
                console.error('❌ FAIL: Send message failed', res.data);
                results.failed++;
            }
        } catch (e) { console.error(e); results.failed++; }
    }

    // 4. Add Annotation
    if (messageId) {
        try {
            console.log('\n📝 Test 2.4: Add Annotation');
            const payload = {
                messageId,
                selectedText: 'Hello',
                type: 'KNOWLEDGE',
                label: 'NOTE',
                startOffset: 0,
                endOffset: 5,
                note: 'This is a test annotation'
            };
            const res = await request('POST', '/annotations', payload, token);
            if (res.status === 201 && res.data.id) {
                console.log('✅ PASS: Annotation created');
                results.passed++;
            } else {
                console.error('❌ FAIL: Annotation failed', res.data);
                results.failed++;
            }
        } catch (e) { console.error(e); results.failed++; }
    }

    // 5. Save Draft
    if (conversationId) {
        try {
            console.log('\n📝 Test 2.5: Save Draft');
            const res = await request('PUT', `/drafts/${conversationId}`, { content: 'Draft content' }, token);
            if (res.status === 200 && res.data.content === 'Draft content') {
                console.log('✅ PASS: Draft saved');
                results.passed++;
            } else {
                console.error('❌ FAIL: Draft save failed', res.data);
                results.failed++;
            }
        } catch (e) { console.error(e); results.failed++; }
    }

    // 6. Project & Task Flow
    try {
        console.log('\n📝 Test 2.6: Initialize Project from Template');
        // Get available templates
        const tmplRes = await request('GET', '/teacher/templates/available', null, token);
        if (tmplRes.status === 200 && tmplRes.data.length > 0) {
            const templateId = tmplRes.data[0].id;

            // Create Project
            const projRes = await request('POST', '/projects', {
                templateId,
                title: 'My Story Project',
                conversationId
            }, token);

            if (projRes.status === 200 && projRes.data.id) {
                projectId = projRes.data.id;
                console.log('✅ PASS: Project created', projectId);
                results.passed++;
            } else {
                console.error('❌ FAIL: Project creation failed', projRes.data);
                results.failed++;
            }
        } else {
            console.error('❌ FAIL: No templates available');
            results.failed++;
        }
    } catch (e) { console.error(e); results.failed++; }


    console.log(`\n📊 Phase 2 Summary: ${results.passed} Passed, ${results.failed} Failed`);
}

runPhase2();
