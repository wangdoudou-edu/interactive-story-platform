import { useTranslation } from 'react-i18next';
import './NoteCard.css';

interface NoteCardProps {
    text: string;
    source?: string;
    createdAt?: string;
    onDelete?: () => void;
}

export default function NoteCard({ text, source, createdAt, onDelete }: NoteCardProps) {
    const { t, i18n } = useTranslation();

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', text);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString(i18n.language === 'en' ? 'en-US' : 'zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            className="note-card"
            draggable
            onDragStart={handleDragStart}
            title={t('noteCard.dragHintTitle')}
        >
            <div className="note-card-header">
                <span className="note-card-pin">📌</span>
                {onDelete && (
                    <button
                        className="note-card-delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        title={t('noteCard.removeTitle')}
                    >
                        ×
                    </button>
                )}
            </div>
            <p className="note-card-text">{text}</p>
            <div className="note-card-meta">
                {source && <span className="note-card-source">{source}</span>}
                {createdAt && <span className="note-card-time">{formatTime(createdAt)}</span>}
            </div>
            <div className="note-card-drag-hint">{t('noteCard.dragHintText')}</div>
        </div>
    );
}
