import prisma from '../lib/prisma';

// 记录用户活动
export async function logActivity(
    userId: string,
    action: string,
    details?: Record<string, any>
) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                details: details ? JSON.stringify(details) : null
            }
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // 不抛出错误，日志失败不应影响主流程
    }
}

// 获取用户活动日志
export async function getUserLogs(userId: string, limit = 100) {
    return prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
}

// 获取所有日志（教师用）
export async function getAllLogs(limit = 1000) {
    return prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit
    });
}

// 导出日志为 JSON
export async function exportLogs(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    return prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'asc' }
    });
}
