import { Router, Response } from 'express';
import { authService } from '../services/auth.service';
import { authMiddleware, teacherOnly, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, password, name, role } = req.body;

        if (!username || !password || !name) {
            return res.status(400).json({ error: '请填写所有必填字段' });
        }

        const result = await authService.register({ username, password, name, role });
        return res.status(201).json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('[Login] Attempting login for:', username);

        if (!username || !password) {
            console.log('[Login] Missing fields');
            return res.status(400).json({ error: '请输入用户名和密码' });
        }

        const result = await authService.login({ username, password });
        console.log('[Login] Success for:', username);
        return res.json(result);
    } catch (error: any) {
        console.log('[Login] Error:', error.message);
        return res.status(401).json({ error: error.message });
    }
});

// 用户登出
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            await authService.logout(token);
        }
        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = await authService.getMe(req.user!.id);
        return res.json(user);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 教师批量创建学生账号
router.post('/batch-create-students', authMiddleware, teacherOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ error: '请提供学生列表' });
        }

        const results = await authService.batchCreateStudents(students);
        return res.json({ results });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
