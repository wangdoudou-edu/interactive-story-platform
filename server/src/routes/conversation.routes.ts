import { Router, Response } from 'express';
import { conversationService } from '../services/conversation.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// 所有对话路由都需要认证
router.use(authMiddleware);

// 创建新对话
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { title } = req.body;
        const conversation = await conversationService.createConversation(
            req.user!.id,
            title
        );
        return res.status(201).json(conversation);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 获取用户所有对话
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const conversations = await conversationService.getUserConversations(
            req.user!.id
        );
        return res.json(conversations);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 获取对话详情
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const conversation = await conversationService.getConversation(
            req.params.id as string,
            req.user!.id
        );
        return res.json(conversation);
    } catch (error: any) {
        return res.status(404).json({ error: error.message });
    }
});

// 发送消息
router.post('/:id/messages', async (req: AuthRequest, res: Response) => {
    try {
        const { content, aiConfigIds } = req.body;

        if (!content) {
            return res.status(400).json({ error: '消息内容不能为空' });
        }

        if (!aiConfigIds || !Array.isArray(aiConfigIds) || aiConfigIds.length === 0) {
            return res.status(400).json({ error: '请选择至少一个AI' });
        }

        const result = await conversationService.sendMessage(
            req.params.id as string,
            req.user!.id,
            content,
            aiConfigIds
        );

        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// 删除对话
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        await conversationService.deleteConversation(req.params.id as string, req.user!.id);
        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
