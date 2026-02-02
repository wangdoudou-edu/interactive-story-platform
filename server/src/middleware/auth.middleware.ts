import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        name: string;
        role: 'STUDENT' | 'TEACHER';
    };
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '未授权：缺少认证令牌' });
        }

        const token = authHeader.split(' ')[1];

        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!session) {
            return res.status(401).json({ error: '未授权：无效令牌' });
        }

        if (new Date() > session.expiresAt) {
            await prisma.session.delete({ where: { id: session.id } });
            return res.status(401).json({ error: '未授权：令牌已过期' });
        }

        req.user = {
            id: session.user.id,
            username: session.user.username,
            name: session.user.name,
            role: session.user.role
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: '认证服务错误' });
    }
};

export const teacherOnly = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'TEACHER') {
        return res.status(403).json({ error: '权限不足：仅教师可访问' });
    }
    next();
};
