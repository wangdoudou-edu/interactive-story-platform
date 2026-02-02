import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/logging.service';

const router = Router();

// 获取消息的所有批注
router.get('/message/:messageId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const messageId = req.params.messageId as string;

        const annotations = await prisma.annotation.findMany({
            where: { messageId },
            orderBy: { startOffset: 'asc' }
        });

        return res.json(annotations);
    } catch (error: any) {
        console.error('Get annotations error:', error);
        return res.status(500).json({ error: '获取批注失败' });
    }
});

// 创建批注（知识点/删除/评论）
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { messageId, selectedText, type, label, note, startOffset, endOffset } = req.body;

        if (!messageId || !selectedText || !type) {
            return res.status(400).json({ error: '缺少必填字段' });
        }

        const annotation = await prisma.annotation.create({
            data: {
                messageId,
                userId: req.user!.id,
                selectedText,
                type, // KNOWLEDGE, DELETE, COMMENT
                label,
                note,
                startOffset,
                endOffset,
                isDeleted: type === 'DELETE'
            }
        });

        // 记录活动日志
        await logActivity(req.user!.id, `ANNOTATION_${type}`, {
            annotationId: annotation.id,
            messageId,
            selectedText: selectedText.substring(0, 100),
            label
        });

        return res.status(201).json(annotation);
    } catch (error: any) {
        console.error('Create annotation error:', error);
        return res.status(500).json({ error: '创建批注失败' });
    }
});

// 更新批注
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { label, note, isDeleted } = req.body;

        const annotation = await prisma.annotation.findFirst({
            where: { id, userId: req.user!.id }
        });

        if (!annotation) {
            return res.status(404).json({ error: '批注不存在' });
        }

        const updated = await prisma.annotation.update({
            where: { id },
            data: {
                ...(label !== undefined && { label }),
                ...(note !== undefined && { note }),
                ...(isDeleted !== undefined && { isDeleted })
            }
        });

        await logActivity(req.user!.id, 'ANNOTATION_UPDATE', {
            annotationId: id,
            label,
            note: note?.substring(0, 100)
        });

        return res.json(updated);
    } catch (error: any) {
        console.error('Update annotation error:', error);
        return res.status(500).json({ error: '更新批注失败' });
    }
});

// 删除批注
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        const annotation = await prisma.annotation.findFirst({
            where: { id, userId: req.user!.id }
        });

        if (!annotation) {
            return res.status(404).json({ error: '批注不存在' });
        }

        await prisma.annotation.delete({ where: { id } });
        await logActivity(req.user!.id, 'ANNOTATION_DELETE', { annotationId: id });

        return res.json({ success: true });
    } catch (error: any) {
        console.error('Delete annotation error:', error);
        return res.status(500).json({ error: '删除批注失败' });
    }
});

export default router;
