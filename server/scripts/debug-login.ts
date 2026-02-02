import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

async function debugLogin() {
    console.log('🔍 Debugging login issue...\n');

    // 检查用户是否存在
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, password: true, role: true }
    });

    console.log('📋 Users in database:');
    for (const user of users) {
        console.log(`  - ${user.email} (${user.role})`);
        console.log(`    Password hash in DB: ${user.password.substring(0, 20)}...`);
    }

    // 验证密码哈希
    console.log('\n🔐 Expected password hashes:');
    console.log(`  student123: ${hashPassword('student123')}`);
    console.log(`  teacher123: ${hashPassword('teacher123')}`);

    // 查找具体用户
    const student = users.find(u => u.email === 'student@ailop.com');
    if (student) {
        const expectedHash = hashPassword('student123');
        console.log('\n🧪 Testing student@ailop.com:');
        console.log(`  DB Hash:       ${student.password}`);
        console.log(`  Expected Hash: ${expectedHash}`);
        console.log(`  Match: ${student.password === expectedHash ? '✅ YES' : '❌ NO'}`);
    } else {
        console.log('\n❌ student@ailop.com not found in database!');
    }
}

debugLogin()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
