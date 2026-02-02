// AI Provider 接口定义
export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIProvider {
    name: string;
    sendMessage(messages: AIMessage[]): Promise<string>;
}

// Gemini Provider (Google)
export class GeminiProvider implements AIProvider {
    name = 'Gemini';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async sendMessage(messages: AIMessage[]): Promise<string> {
        // 转换消息格式为 Gemini API 格式
        const contents = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

        const systemInstruction = messages.find(m => m.role === 'system')?.content;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${error}`);
        }

        const data = await response.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
        return data.candidates[0].content.parts[0].text;
    }
}

// OpenAI GPT Provider
export class OpenAIProvider implements AIProvider {
    name = 'GPT-4';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async sendMessage(messages: AIMessage[]): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        return data.choices[0].message.content;
    }
}

// DeepSeek Provider
export class DeepSeekProvider implements AIProvider {
    name = 'DeepSeek';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = 'deepseek-chat') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async sendMessage(messages: AIMessage[]): Promise<string> {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.statusText}`);
        }

        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        return data.choices[0].message.content;
    }
}

// Qwen3 Provider (阿里通义千问 - DashScope API)
export class QwenProvider implements AIProvider {
    name = 'Qwen3';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = 'qwen-max') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async sendMessage(messages: AIMessage[]): Promise<string> {
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Qwen API error: ${errorText}`);
        }

        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        return data.choices[0].message.content;
    }
}

// AI 服务管理器
export class AIService {
    private providers: Map<string, AIProvider> = new Map();

    constructor() {
        // 从环境变量初始化 providers
        if (process.env.GEMINI_API_KEY) {
            this.providers.set('gemini', new GeminiProvider(process.env.GEMINI_API_KEY));
        }
        if (process.env.OPENAI_API_KEY) {
            this.providers.set('openai', new OpenAIProvider(process.env.OPENAI_API_KEY));
        }
        if (process.env.DASHSCOPE_API_KEY) {
            this.providers.set('qwen', new QwenProvider(process.env.DASHSCOPE_API_KEY));
        }
        if (process.env.DEEPSEEK_API_KEY) {
            this.providers.set('deepseek', new DeepSeekProvider(process.env.DEEPSEEK_API_KEY));
        }
    }

    getProvider(name: string): AIProvider | undefined {
        return this.providers.get(name);
    }

    getAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    async sendToMultipleAIs(
        providerIds: string[],
        messages: AIMessage[]
    ): Promise<{ providerId: string; response: string; error?: string }[]> {
        const results = await Promise.allSettled(
            providerIds.map(async (providerId) => {
                const provider = this.providers.get(providerId);
                if (!provider) {
                    throw new Error(`Provider ${providerId} not found`);
                }
                const response = await provider.sendMessage(messages);
                return { providerId, response };
            })
        );

        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                return {
                    providerId: providerIds[index],
                    response: '',
                    error: result.reason?.message || '未知错误'
                };
            }
        });
    }
}

export const aiService = new AIService();
