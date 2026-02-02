
const API_BASE = 'http://127.0.0.1:3001/api';

async function verify() {
    console.log('🔍 Starting API Verification...');

    // 1. Teacher Login
    console.log('\n--- 1. Teacher Login (teacher1) ---');
    let teacherToken = '';
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'teacher1', password: 'teacher123' })
        });
        const data = await res.json();
        if (res.ok) {
            console.log('✅ Login Success');
            teacherToken = data.token;
        } else {
            console.error('❌ Login Failed:', data);
        }
    } catch (err) {
        console.error('❌ Request Failed:', err.message);
    }

    // 2. Student Login
    console.log('\n--- 2. Student Login (student1) ---');
    let studentToken = '';
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'student1', password: 'student123' })
        });
        const data = await res.json();
        if (res.ok) {
            console.log('✅ Login Success');
            studentToken = data.token;
        } else {
            console.error('❌ Login Failed:', data);
        }
    } catch (err) {
        console.error('❌ Request Failed:', err.message);
    }

    // 3. Teacher Dashboard Data
    if (teacherToken) {
        console.log('\n--- 3. Teacher Dashboard Data ---');
        try {
            const res = await fetch(`${API_BASE}/teacher/dashboard`, {
                headers: { 'Authorization': `Bearer ${teacherToken}` }
            });
            const data = await res.json();
            if (res.ok) {
                console.log('✅ Dashboard Data Retrieved');
                console.log(`   - Students: ${data.students?.length || 0}`);
                console.log(`   - Active: ${data.activeCount}`);
            } else {
                console.error('❌ Dashboard Access Failed:', data);
            }
        } catch (err) { console.error(err.message); }
    }

    // 4. Student Project Data
    if (studentToken) {
        console.log('\n--- 4. Student Project Data ---');
        try {
            const res = await fetch(`${API_BASE}/projects/current`, {
                headers: { 'Authorization': `Bearer ${studentToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('✅ Project Data Retrieved');
                if (data.project) {
                    console.log(`   - Project ID: ${data.project.id}`);
                    console.log(`   - Status: ${data.project.status}`);
                } else {
                    console.log('   - No active project found (Expected for new student)');
                }
            } else {
                // It might be 404 if no project, handling that
                console.log('ℹ️ Check response:', res.status, res.statusText);
            }
        } catch (err) { console.error(err.message); }
    }

    console.log('\n🏁 Verification Complete');
}

verify();
