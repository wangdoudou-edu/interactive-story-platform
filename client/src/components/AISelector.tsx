import { useChatStore } from '../stores/chatStore';
import './AISelector.css';

export default function AISelector() {
    const { aiConfigs, selectedAIIds, toggleAISelection } = useChatStore();

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'gemini': return '#4285f4';
            case 'openai': return '#10a37f';
            case 'deepseek': return '#7c3aed';
            default: return '#6366f1';
        }
    };

    if (aiConfigs.length === 0) {
        return (
            <div className="ai-selector">
                <div className="ai-selector-empty">
                    <span>暂无可用的 AI 配置</span>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-selector">
            <div className="ai-selector-label">
                <span className="label-icon">🤖</span>
                <span>选择 AI:</span>
            </div>
            <div className="ai-chips">
                {aiConfigs.map(ai => {
                    const isSelected = selectedAIIds.includes(ai.id);
                    const color = getProviderColor(ai.provider);

                    return (
                        <button
                            key={ai.id}
                            className={`ai-chip ${isSelected ? 'selected' : ''}`}
                            style={{
                                '--chip-color': color,
                            } as React.CSSProperties}
                            onClick={() => toggleAISelection(ai.id)}
                            title={ai.description || ai.name}
                        >
                            <span className="ai-chip-avatar">{ai.avatar || '🤖'}</span>
                            <span className="ai-chip-name">{ai.name}</span>
                            <span className="ai-chip-provider">{ai.provider}</span>
                            {isSelected && <span className="ai-chip-check">✓</span>}
                        </button>
                    );
                })}
            </div>
            {selectedAIIds.length === 0 && (
                <div className="ai-selector-warning">
                    ⚠️ 请至少选择一个 AI 进行对话
                </div>
            )}
        </div>
    );
}
