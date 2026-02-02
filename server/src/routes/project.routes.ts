import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ==================== 学生项目 API ====================

// 获取当前用户的项目列表
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            where: { userId: req.user!.id },
            include: {
                template: true,
                progress: { orderBy: { taskIndex: 'asc' } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        return res.status(500).json({ error: 'Failed to get projects' });
    }
});

// 创建新项目
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { templateId, title, conversationId } = req.body;

        // 获取模板
        const template = await prisma.taskTemplate.findUnique({
            where: { id: templateId as string }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const project = await prisma.project.create({
            data: {
                userId: req.user!.id,
                templateId: templateId as string,
                title: title as string,
                conversationId: conversationId as string | undefined
            },
            include: { template: true }
        });

        // 创建任务进度记录
        const tasks = template.tasks as any[];
        await prisma.taskProgress.createMany({
            data: tasks.map((_: any, index: number) => ({
                projectId: project.id,
                taskIndex: index,
                status: index === 0 ? 'IN_PROGRESS' : 'PENDING'
            }))
        });

        // 记录活动日志
        await prisma.activityLog.create({
            data: {
                userId: req.user!.id,
                action: 'TASK_START',
                details: JSON.stringify({ projectId: project.id, taskIndex: 0 })
            }
        });

        return res.json(project);
    } catch (error) {
        console.error('Create project error:', error);
        return res.status(500).json({ error: 'Failed to create project' });
    }
});

// 获取项目详情
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const projectId = req.params.id as string;
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                template: true,
                progress: { orderBy: { taskIndex: 'asc' } },
                conversation: true
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // 检查权限
        if (project.userId !== req.user!.id && req.user!.role !== 'TEACHER') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        return res.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        return res.status(500).json({ error: 'Failed to get project' });
    }
});

// 更新任务进度
router.put('/:id/progress/:taskIndex', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const projectId = req.params.id as string;
        const taskIndexStr = req.params.taskIndex as string;
        const taskIndexNum = parseInt(taskIndexStr);
        const { studentContent, aiContent, status } = req.body;

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project || project.userId !== req.user!.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // 计算 AI 占比（基于学生手写内容比例）
        const studentLen = (studentContent || '').length;
        const aiLen = (aiContent || '').length;
        const total = studentLen + aiLen;
        const aiRatio = total > 0 ? aiLen / total : 0;

        const progress = await prisma.taskProgress.upsert({
            where: {
                projectId_taskIndex: {
                    projectId: projectId,
                    taskIndex: taskIndexNum
                }
            },
            update: {
                studentContent,
                aiContent,
                aiRatio,
                status: status || undefined,
                lastActiveAt: new Date(),
                startedAt: status === 'IN_PROGRESS' ? new Date() : undefined,
                completedAt: status === 'COMPLETED' ? new Date() : undefined
            },
            create: {
                projectId: projectId,
                taskIndex: taskIndexNum,
                studentContent,
                aiContent,
                aiRatio,
                status: status || 'IN_PROGRESS',
                startedAt: new Date()
            }
        });

        // 如果完成当前任务，记录日志
        if (status === 'COMPLETED') {
            await prisma.activityLog.create({
                data: {
                    userId: req.user!.id,
                    action: 'TASK_COMPLETE',
                    details: JSON.stringify({ projectId: projectId, taskIndex: taskIndexNum, aiRatio })
                }
            });

            // 自动开始下一个任务
            const nextTaskIndex = taskIndexNum + 1;
            await prisma.taskProgress.updateMany({
                where: {
                    projectId: projectId,
                    taskIndex: nextTaskIndex,
                    status: 'PENDING'
                },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date()
                }
            });

            // 更新项目当前任务
            await prisma.project.update({
                where: { id: projectId },
                data: { currentTask: nextTaskIndex }
            });
        }

        return res.json(progress);
    } catch (error) {
        console.error('Update progress error:', error);
        return res.status(500).json({ error: 'Failed to update progress' });
    }
});

// 记录 AI 比较行为
router.post('/:id/compare', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const projectId = req.params.id as string;
        const { aiConfigs, taskIndex, selectedAiId } = req.body;

        await prisma.activityLog.create({
            data: {
                userId: req.user!.id,
                action: selectedAiId ? 'SELECT_AI_OUTPUT' : 'COMPARE_AI_OUTPUTS',
                details: JSON.stringify({
                    projectId: projectId,
                    taskIndex,
                    aiConfigs,
                    selectedAiId
                })
            }
        });

        return res.json({ success: true });
    } catch (error) {
        console.error('Compare log error:', error);
        return res.status(500).json({ error: 'Failed to log comparison' });
    }
});

// 获取未读提醒
router.get('/reminders/unread', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const reminders = await prisma.teacherReminder.findMany({
            where: {
                studentId: req.user!.id,
                readAt: null
            },
            orderBy: { sentAt: 'desc' }
        });

        return res.json(reminders);
    } catch (error) {
        console.error('Get reminders error:', error);
        return res.status(500).json({ error: 'Failed to get reminders' });
    }
});

// 标记提醒已读
router.put('/reminders/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const reminderId = req.params.id as string;
        const reminder = await prisma.teacherReminder.update({
            where: { id: reminderId },
            data: { readAt: new Date() }
        });

        return res.json(reminder);
    } catch (error) {
        console.error('Mark read error:', error);
        return res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// 默认互动叙事设计任务模板
const DEFAULT_TEMPLATE_TASKS = [
    { phase: 1, name: '核心概念', description: '故事主题、核心冲突、情感基调', softPrompts: ['建议先独立思考核心概念，再用AI拓展想法'], suggestedAICount: 2 },
    { phase: 1, name: '世界观设定', description: '世界规则、历史背景、视觉风格', softPrompts: ['可以让多个AI分别生成世界观元素，然后自己整合'], suggestedAICount: 2 },
    { phase: 2, name: '角色系统', description: '主角、配角、角色关系图谱', softPrompts: ['角色性格和动机需要自己深度思考'], suggestedAICount: 2 },
    { phase: 2, name: '剧情线设计', description: '主线、支线、分支节点', softPrompts: ['多用AI比较不同的剧情走向'], suggestedAICount: 3 },
    { phase: 2, name: '交互节点', description: '玩家选择点、后果分支', softPrompts: ['关注选择的意义感和后果差异'], suggestedAICount: 2 },
    { phase: 2, name: '对白设计', description: '关键对话、分支对话、情感表达', softPrompts: ['对白风格需要自己把控，AI可辅助生成备选'], suggestedAICount: 2 },
    { phase: 3, name: '整合与迭代', description: '流程图、一致性检查、润色', softPrompts: ['检查各部分的一致性和完整性'], suggestedAICount: 1 }
];

// 获取可用模板列表（学生用）- 如果没有模板则自动创建默认模板
router.get('/templates/available', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        let templates = await prisma.taskTemplate.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        // 如果没有模板，创建默认模板
        if (templates.length === 0) {
            const defaultTemplate = await prisma.taskTemplate.create({
                data: {
                    name: '互动叙事设计方案',
                    description: '完整的互动叙事设计流程，包含概念、世界观、角色、剧情、交互和对白设计',
                    tasks: DEFAULT_TEMPLATE_TASKS,
                    createdBy: req.user!.id // 使用当前用户作为创建者
                }
            });
            templates = [defaultTemplate];
        }

        return res.json(templates);
    } catch (error) {
        console.error('Get templates error:', error);
        return res.status(500).json({ error: 'Failed to get templates' });
    }
});

export default router;

