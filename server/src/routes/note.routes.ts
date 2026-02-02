import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/logging.service';

const router = Router();

// 获取对话的笔记
router.get('/:conversationId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;

        let note = await prisma.note.findFirst({
            where: { conversationId, userId: req.user!.id }
        });

        // 如果不存在则创建空笔记
        if (!note) {
            note = await prisma.note.create({
                data: {
                    userId: req.user!.id,
                    conversationId,
                    content: ''
                }
            });
        }

        return res.json(note);
    } catch (error: any) {
        console.error('Get note error:', error);
        return res.status(500).json({ error: '获取笔记失败' });
    }
});

// 更新笔记内容
router.put('/:conversationId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;
        const { content } = req.body;

        let note = await prisma.note.findFirst({
            where: { conversationId, userId: req.user!.id }
        });

        if (note) {
            note = await prisma.note.update({
                where: { id: note.id },
                data: { content }
            });
        } else {
            note = await prisma.note.create({
                data: {
                    userId: req.user!.id,
                    conversationId,
                    content
                }
            });
        }

        await logActivity(req.user!.id, 'NOTE_UPDATE', {
            conversationId,
            contentLength: content.length
        });

        return res.json(note);
    } catch (error: any) {
        console.error('Update note error:', error);
        return res.status(500).json({ error: '更新笔记失败' });
    }
});

// 添加知识点到笔记
router.post('/:conversationId/add-knowledge', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;
        const { text, source } = req.body;

        let note = await prisma.note.findFirst({
            where: { conversationId, userId: req.user!.id }
        });

        // 将知识点追加到笔记末尾
        const newContent = note?.content
            ? `${note.content}\n\n📌 ${text}\n— 来源: ${source}`
            : `📌 ${text}\n— 来源: ${source}`;

        if (note) {
            note = await prisma.note.update({
                where: { id: note.id },
                data: { content: newContent }
            });
        } else {
            note = await prisma.note.create({
                data: {
                    userId: req.user!.id,
                    conversationId,
                    content: newContent
                }
            });
        }

        await logActivity(req.user!.id, 'NOTE_ADD_KNOWLEDGE', {
            conversationId,
            text: text.substring(0, 100),
            source
        });

        return res.json(note);
    } catch (error: any) {
        console.error('Add knowledge error:', error);
        return res.status(500).json({ error: '添加知识点失败' });
    }
});

export default router;
