import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/logging.service';

const router = Router();

// 获取对话的草稿
router.get('/:conversationId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;

        let draft = await prisma.draft.findFirst({
            where: { conversationId, userId: req.user!.id }
        });

        if (!draft) {
            draft = await prisma.draft.create({
                data: {
                    userId: req.user!.id,
                    conversationId,
                    content: ''
                }
            });
        }

        return res.json(draft);
    } catch (error: any) {
        console.error('Get draft error:', error);
        return res.status(500).json({ error: '获取草稿失败' });
    }
});

// 更新草稿内容
router.put('/:conversationId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;
        const { content } = req.body;

        let draft = await prisma.draft.findFirst({
            where: { conversationId, userId: req.user!.id }
        });

        if (draft) {
            draft = await prisma.draft.update({
                where: { id: draft.id },
                data: { content }
            });
        } else {
            draft = await prisma.draft.create({
                data: {
                    userId: req.user!.id,
                    conversationId,
                    content
                }
            });
        }

        await logActivity(req.user!.id, 'DRAFT_UPDATE', {
            conversationId,
            contentLength: content.length
        });

        return res.json(draft);
    } catch (error: any) {
        console.error('Update draft error:', error);
        return res.status(500).json({ error: '更新草稿失败' });
    }
});

// 整理：将批注内容添加到草稿
router.post('/:conversationId/organize', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;
        const { messageId, aiName, content, annotations } = req.body;

        let draft = await prisma.draft.findFirst({
            where: { conversationId, userId: req.user!.id }
        });

        // 格式化整理内容
        let organizedContent = `\n\n---\n### 来自 ${aiName} 的整理\n`;

        if (annotations && annotations.length > 0) {
            annotations.forEach((a: any) => {
                const labelEmojiMap: Record<string, string> = {
                    DOUBT: '❓',
                    INSPIRATION: '💡',
                    QUESTION: '🤔',
                    NOTE: '📝'
                };
                const labelEmoji = labelEmojiMap[a.label] || '📌';

                organizedContent += `\n${labelEmoji} "${a.selectedText}"`;
                if (a.note) {
                    organizedContent += `\n   → ${a.note}`;
                }
            });
        } else {
            organizedContent += `\n${content}`;
        }

        const newContent = draft?.content
            ? `${draft.content}${organizedContent}`
            : organizedContent;

        if (draft) {
            draft = await prisma.draft.update({
                where: { id: draft.id },
                data: { content: newContent }
            });
        } else {
            draft = await prisma.draft.create({
                data: {
                    userId: req.user!.id,
                    conversationId,
                    content: newContent
                }
            });
        }

        await logActivity(req.user!.id, 'DRAFT_ORGANIZE', {
            conversationId,
            messageId,
            aiName,
            annotationCount: annotations?.length || 0
        });

        return res.json(draft);
    } catch (error: any) {
        console.error('Organize error:', error);
        return res.status(500).json({ error: '整理失败' });
    }
});

// 保存草稿快照（开始下一轮）
router.post('/:conversationId/snapshot', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;

        // 获取当前草稿
        const draft = await prisma.draft.findFirst({
            where: { conversationId, userId: req.user!.id }
        });

        if (!draft || !draft.content) {
            return res.status(400).json({ error: '草稿为空' });
        }

        // 获取当前轮数
        const lastHistory = await prisma.draftHistory.findFirst({
            where: { conversationId, userId: req.user!.id },
            orderBy: { roundNumber: 'desc' }
        });

        const roundNumber = (lastHistory?.roundNumber || 0) + 1;

        // 创建快照
        const snapshot = await prisma.draftHistory.create({
            data: {
                userId: req.user!.id,
                conversationId,
                roundNumber,
                content: draft.content
            }
        });

        await logActivity(req.user!.id, 'DRAFT_SNAPSHOT', {
            conversationId,
            roundNumber
        });

        return res.json(snapshot);
    } catch (error: any) {
        console.error('Snapshot error:', error);
        return res.status(500).json({ error: '保存快照失败' });
    }
});

// 获取草稿历史
router.get('/:conversationId/history', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;

        const history = await prisma.draftHistory.findMany({
            where: { conversationId, userId: req.user!.id },
            orderBy: { roundNumber: 'asc' }
        });

        return res.json(history);
    } catch (error: any) {
        console.error('Get history error:', error);
        return res.status(500).json({ error: '获取历史失败' });
    }
});

export default router;
