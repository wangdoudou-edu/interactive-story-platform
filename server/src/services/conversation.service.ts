import prisma from '../lib/prisma';
import { aiService, AIMessage } from './ai.service';

export class ConversationService {
    // 创建新对话
    async createConversation(userId: string, title?: string) {
        return prisma.conversation.create({
            data: {
                userId,
                title: title || `新对话 ${new Date().toLocaleString('zh-CN')}`
            }
        });
    }

    // 获取用户的所有对话
    async getUserConversations(userId: string) {
        return prisma.conversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }

    // 获取对话详情（包含所有消息）
    async getConversation(conversationId: string, userId: string) {
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        aiConfig: true,
                        annotations: true
                    }
                }
            }
        });

        if (!conversation) {
            throw new Error('对话不存在');
        }

        return conversation;
    }

    // 发送消息到多个AI
    async sendMessage(
        conversationId: string,
        userId: string,
        content: string,
        aiConfigIds: string[]
    ) {
        // 验证对话归属
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId }
        });

        if (!conversation) {
            throw new Error('对话不存在');
        }

        // 保存用户消息
        const userMessage = await prisma.message.create({
            data: {
                conversationId,
                role: 'user',
                content
            }
        });

        // 获取对话历史以构建上下文
        const history = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: { aiConfig: true }
        });

        // 构建对话历史（只保留最近10轮）
        const recentHistory = history.slice(-20);
        const messages: AIMessage[] = recentHistory.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
        }));

        // 获取 AI 配置
        const aiConfigs = await prisma.aIConfig.findMany({
            where: { id: { in: aiConfigIds }, isActive: true }
        });

        // 向多个 AI 发送请求
        const responses = await aiService.sendToMultipleAIs(
            aiConfigs.map(c => c.provider),
            messages
        );

        // 保存 AI 回复
        const assistantMessages = await Promise.all(
            responses.map(async (resp, index) => {
                const aiConfig = aiConfigs[index];
                return prisma.message.create({
                    data: {
                        conversationId,
                        role: 'assistant',
                        content: resp.error ? `[错误] ${resp.error}` : resp.response,
                        aiConfigId: aiConfig?.id
                    },
                    include: { aiConfig: true }
                });
            })
        );

        // 更新对话时间
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        return {
            userMessage,
            assistantMessages
        };
    }

    // 删除对话
    async deleteConversation(conversationId: string, userId: string) {
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId }
        });

        if (!conversation) {
            throw new Error('对话不存在');
        }

        await prisma.conversation.delete({ where: { id: conversationId } });
        return { success: true };
    }
}

export const conversationService = new ConversationService();
