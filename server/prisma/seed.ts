import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 创建默认 AI 配置
    const aiConfigs = [
        {
            name: 'Gemini Pro',
            provider: 'gemini',
            model: 'gemini-2.0-flash',
            avatar: '🔮',
            description: 'Google 的强大 AI 模型，擅长推理和创意写作',
            systemPrompt: '你是一个友好且专业的 AI 助手，擅长帮助用户思考和解决问题。请用简洁清晰的中文回答问题。',
        },
        {
            name: 'GPT-4',
            provider: 'openai',
            model: 'gpt-4',
            avatar: '🧠',
            description: 'OpenAI 的旗舰模型，强大的综合能力',
            systemPrompt: '你是一个友好且专业的 AI 助手。请用简洁清晰的中文回答问题，提供有价值的见解。',
        },
        {
            name: 'Qwen3 Max',
            provider: 'qwen',
            model: 'qwen-max',
            avatar: '🌟',
            description: '阿里通义千问最强模型，顶级中文理解能力',
            systemPrompt: '你是一个友好且专业的 AI 助手。请用简洁清晰的中文回答问题，提供有价值的见解。',
        },
        {
            name: 'DeepSeek Chat',
            provider: 'deepseek',
            model: 'deepseek-chat',
            avatar: '🌊',
            description: '高性价比的国产大模型，对中文支持优秀',
            systemPrompt: '你是一个友好且专业的 AI 助手。请用简洁清晰的中文回答问题。',
        },
    ];

    for (const config of aiConfigs) {
        const existing = await prisma.aIConfig.findFirst({
            where: {
                provider: config.provider,
                model: config.model,
            },
        });

        if (!existing) {
            await prisma.aIConfig.create({ data: config });
            console.log(`✅ Created AI config: ${config.name}`);
        } else {
            console.log(`⏭️  Skipped (already exists): ${config.name}`);
        }
    }

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
