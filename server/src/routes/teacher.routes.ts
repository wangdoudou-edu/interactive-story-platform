import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, authMiddleware, teacherOnly } from '../middleware/auth.middleware';

const router = Router();

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

// 获取或创建默认模板
async function getDefaultTemplate(teacherId: string) {
    let template = await prisma.taskTemplate.findFirst({
        where: { name: '互动叙事设计方案', createdBy: teacherId }
    });

    if (!template) {
        template = await prisma.taskTemplate.create({
            data: {
                name: '互动叙事设计方案',
                description: '完整的互动叙事设计流程，包含概念、世界观、角色、剧情、交互和对白设计',
                tasks: DEFAULT_TEMPLATE_TASKS,
                createdBy: teacherId
            }
        });
    }

    return template;
}

// ==================== 教师仪表盘 API ====================

// 获取班级实时状态
router.get('/dashboard', authMiddleware, teacherOnly, async (req: AuthRequest, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                user: { select: { id: true, name: true, username: true } },
                template: true,
                progress: true
            },
            orderBy: { updatedAt: 'desc' }
        });

        // 计算每个学生的状态
        const studentStatus = projects.map(project => {
            const totalTasks = (project.template.tasks as any[]).length;
            const completedTasks = project.progress.filter(p => p.status === 'COMPLETED').length;
            const currentProgress = project.progress.find(p => p.status === 'IN_PROGRESS');

            // 计算总体AI占比
            const avgAiRatio = project.progress.length > 0
                ? project.progress.reduce((sum, p) => sum + p.aiRatio, 0) / project.progress.length
                : 0;

            // 计算活跃度（基于最后活跃时间）
            const lastActive = currentProgress?.lastActiveAt || project.updatedAt;
            const idleMinutes = Math.floor((Date.now() - new Date(lastActive).getTime()) / 60000);

            let activityStatus: 'active' | 'idle' | 'stuck' = 'active';
            if (idleMinutes > 10) activityStatus = 'stuck';
            else if (idleMinutes > 5) activityStatus = 'idle';

            return {
                projectId: project.id,
                student: project.user,
                projectTitle: project.title,
                currentPhase: project.currentPhase,
                currentTask: project.currentTask,
                totalTasks,
                completedTasks,
                aiRatio: Math.round(avgAiRatio * 100),
                activityStatus,
                idleMinutes,
                status: project.status
            };
        });

        return res.json({
            totalStudents: studentStatus.length,
            activeCount: studentStatus.filter(s => s.activityStatus === 'active').length,
            idleCount: studentStatus.filter(s => s.activityStatus === 'idle').length,
            stuckCount: studentStatus.filter(s => s.activityStatus === 'stuck').length,
            students: studentStatus
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

// 获取单个学生详情
router.get('/student/:userId', authMiddleware, teacherOnly, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.userId as string;

        const projects = await prisma.project.findMany({
            where: { userId },
            include: {
                user: { select: { id: true, name: true, username: true } },
                template: true,
                progress: { orderBy: { taskIndex: 'asc' } },
                conversation: {
                    include: {
                        messages: { orderBy: { createdAt: 'desc' }, take: 20 }
                    }
                }
            }
        });

        // 获取该学生的活动日志
        const activityLogs = await prisma.activityLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return res.json({ projects, activityLogs });
    } catch (error) {
        console.error('Student detail error:', error);
        return res.status(500).json({ error: 'Failed to load student details' });
    }
});

// 发送私信提醒
router.post('/reminder', authMiddleware, teacherOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { studentId, projectId, message, type } = req.body;

        const reminder = await prisma.teacherReminder.create({
            data: {
                teacherId: req.user!.id,
                studentId,
                projectId,
                message,
                type: type || 'GENERAL'
            }
        });

        // 记录活动日志
        await prisma.activityLog.create({
            data: {
                userId: studentId,
                action: 'TEACHER_REMINDER',
                details: JSON.stringify({ reminderId: reminder.id, type, message })
            }
        });

        return res.json(reminder);
    } catch (error) {
        console.error('Send reminder error:', error);
        return res.status(500).json({ error: 'Failed to send reminder' });
    }
});

// 获取分析报告
router.get('/analytics', authMiddleware, teacherOnly, async (req: AuthRequest, res: Response) => {
    try {
        // 获取所有项目的统计数据
        const projects = await prisma.project.findMany({
            include: {
                progress: true,
                template: true
            }
        });

        // 各任务的平均完成时间
        const taskStats: Record<number, { count: number; totalTime: number; avgAiRatio: number }> = {};

        for (const project of projects) {
            for (const prog of project.progress) {
                if (prog.completedAt && prog.startedAt) {
                    if (!taskStats[prog.taskIndex]) {
                        taskStats[prog.taskIndex] = { count: 0, totalTime: 0, avgAiRatio: 0 };
                    }
                    const duration = new Date(prog.completedAt).getTime() - new Date(prog.startedAt).getTime();
                    taskStats[prog.taskIndex].count++;
                    taskStats[prog.taskIndex].totalTime += duration;
                    taskStats[prog.taskIndex].avgAiRatio += prog.aiRatio;
                }
            }
        }

        // 计算平均值
        const taskAnalytics = Object.entries(taskStats).map(([index, stats]) => ({
            taskIndex: parseInt(index),
            avgDurationMinutes: Math.round(stats.totalTime / stats.count / 60000),
            avgAiRatio: Math.round((stats.avgAiRatio / stats.count) * 100),
            completedCount: stats.count
        }));

        // 活动类型统计
        const activityStats = await prisma.activityLog.groupBy({
            by: ['action'],
            _count: { action: true }
        });

        return res.json({
            totalProjects: projects.length,
            completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
            taskAnalytics,
            activityStats: activityStats.map(s => ({ action: s.action, count: s._count.action }))
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return res.status(500).json({ error: 'Failed to load analytics' });
    }
});

// 获取任务模板列表
router.get('/templates', authMiddleware, teacherOnly, async (req: AuthRequest, res: Response) => {
    try {
        const templates = await prisma.taskTemplate.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        // 确保有默认模板
        if (templates.length === 0) {
            const defaultTemplate = await getDefaultTemplate(req.user!.id);
            return res.json([defaultTemplate]);
        }

        return res.json(templates);
    } catch (error) {
        console.error('Templates error:', error);
        return res.status(500).json({ error: 'Failed to load templates' });
    }
});

// 初始化默认模板
router.post('/templates/init', authMiddleware, teacherOnly, async (req: AuthRequest, res: Response) => {
    try {
        const template = await getDefaultTemplate(req.user!.id);
        return res.json(template);
    } catch (error) {
        console.error('Init template error:', error);
        return res.status(500).json({ error: 'Failed to initialize template' });
    }
});

export default router;
