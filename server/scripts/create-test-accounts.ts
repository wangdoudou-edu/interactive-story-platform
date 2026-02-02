import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

async function createTestAccounts() {
    console.log('📝 Creating test accounts...');

    // 创建教师账号
    const teacher = await prisma.user.upsert({
        where: { username: 'teacher' },
        update: {},
        create: {
            username: 'teacher',
            password: hashPassword('teacher123'),
            name: '王老师',
            role: 'TEACHER',
        },
    });
    console.log('✅ 教师账号:', teacher.username);

    // 创建学生账号
    const student = await prisma.user.upsert({
        where: { username: 'student' },
        update: {},
        create: {
            username: 'student',
            password: hashPassword('student123'),
            name: '张同学',
            role: 'STUDENT',
        },
    });
    console.log('✅ 学生账号:', student.username);

    console.log('\n📋 测试账号信息:');
    console.log('-------------------');
    console.log('教师: teacher / teacher123');
    console.log('学生: student / student123');
    console.log('-------------------');
}

createTestAccounts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
