import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, teacherOnly, AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';

const router = Router();

router.use(authMiddleware);

// 获取所有可用的 AI 配置
router.get('/configs', async (req: AuthRequest, res: Response) => {
    try {
        const configs = await prisma.aIConfig.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                provider: true,
                model: true,
                avatar: true,
                description: true
            }
        });
        return res.json(configs);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 获取可用的 AI providers（系统级别）
router.get('/providers', async (req: AuthRequest, res: Response) => {
    try {
        const providers = aiService.getAvailableProviders();
        return res.json(providers);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 教师：创建 AI 配置
router.post('/configs', teacherOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { name, provider, model, systemPrompt, avatar, description } = req.body;

        if (!name || !provider || !model) {
            return res.status(400).json({ error: '名称、提供商和模型不能为空' });
        }

        const config = await prisma.aIConfig.create({
            data: {
                name,
                provider,
                model,
                systemPrompt,
                avatar,
                description
            }
        });

        return res.status(201).json(config);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 教师：更新 AI 配置
router.put('/configs/:id', teacherOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { name, provider, model, systemPrompt, avatar, description, isActive } = req.body;

        const config = await prisma.aIConfig.update({
            where: { id: req.params.id as string },
            data: {
                name,
                provider,
                model,
                systemPrompt,
                avatar,
                description,
                isActive
            }
        });

        return res.json(config);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 教师：删除 AI 配置
router.delete('/configs/:id', teacherOnly, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.aIConfig.delete({ where: { id: req.params.id as string } });
        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
