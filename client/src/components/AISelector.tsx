import { useTranslation } from 'react-i18next';
import { useChatStore } from '../stores/chatStore';
import './AISelector.css';

export default function AISelector() {
    const { t } = useTranslation();
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
                    <span>{t('aiSelector.empty')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-selector">
            <div className="ai-selector-label">
                <span className="label-icon">🤖</span>
                <span>{t('aiSelector.title')}</span>
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
                    {t('aiSelector.warning')}
                </div>
            )}
        </div>
    );
}
