import prisma from '../lib/prisma';
import crypto from 'crypto';

// 简单的密码哈希（生产环境应使用 bcrypt）
export const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

export const verifyPassword = (password: string, hash: string): boolean => {
    return hashPassword(password) === hash;
};

export const generateToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

interface RegisterInput {
    username: string;
    password: string;
    name: string;
    role?: 'STUDENT' | 'TEACHER';
}

interface LoginInput {
    username: string;
    password: string;
}

export class AuthService {
    async register(input: RegisterInput) {
        const { username, password, name, role = 'STUDENT' } = input;

        // 检查用户名是否已存在
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            throw new Error('该用户名已被注册');
        }

        // 创建用户
        const user = await prisma.user.create({
            data: {
                username,
                password: hashPassword(password),
                name,
                role
            }
        });

        // 创建会话
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天

        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt
            }
        });

        return {
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            },
            token
        };
    }

    async login(input: LoginInput) {
        const { username, password } = input;
        console.log('[Login] Attempting login for:', username);

        // 查找用户
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            throw new Error('用户名或密码错误');
        }

        // 验证密码
        if (!verifyPassword(password, user.password)) {
            throw new Error('用户名或密码错误');
        }

        // 创建新会话
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt
            }
        });

        return {
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            },
            token
        };
    }

    async logout(token: string) {
        await prisma.session.deleteMany({ where: { token } });
        return { success: true };
    }

    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        return user;
    }

    // 教师批量创建学生账号
    async batchCreateStudents(students: { username: string; name: string; password: string }[]) {
        const results = [];

        for (const student of students) {
            try {
                const user = await prisma.user.create({
                    data: {
                        username: student.username,
                        password: hashPassword(student.password),
                        name: student.name,
                        role: 'STUDENT'
                    }
                });
                results.push({ success: true, username: student.username, id: user.id });
            } catch (error) {
                results.push({ success: false, username: student.username, error: '创建失败' });
            }
        }

        return results;
    }
}

export const authService = new AuthService();
