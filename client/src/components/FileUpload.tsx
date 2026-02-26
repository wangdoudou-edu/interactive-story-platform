import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './FileUpload.css';

interface UploadedFile {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
}

interface FileUploadProps {
    onUpload: (files: UploadedFile[]) => void;
    multiple?: boolean;
}

const API_BASE = 'http://localhost:3001/api';

export default function FileUpload({ onUpload, multiple = false }: FileUploadProps) {
    const { t } = useTranslation();
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFiles = async (files: FileList) => {
        if (files.length === 0) return;

        setUploading(true);
        const token = localStorage.getItem('token');

        try {
            const formData = new FormData();

            if (multiple && files.length > 1) {
                Array.from(files).forEach(file => {
                    formData.append('files', file);
                });

                const response = await fetch(`${API_BASE}/uploads/multiple`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });

                if (!response.ok) throw new Error(t('fileUpload.failed'));
                const uploadedFiles = await response.json();
                onUpload(uploadedFiles);
            } else {
                formData.append('file', files[0]);

                const response = await fetch(`${API_BASE}/uploads`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });

                if (!response.ok) throw new Error(t('fileUpload.failed'));
                const uploadedFile = await response.json();
                onUpload([uploadedFile]);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(t('fileUpload.errorAlert'));
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            uploadFiles(e.target.files);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files) {
            uploadFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    return (
        <div
            className={`file-upload ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple={multiple}
                accept="image/*,.pdf,.txt,.md,.doc,.docx"
                style={{ display: 'none' }}
            />

            {uploading ? (
                <div className="upload-status">
                    <span className="spinner">⏳</span>
                    <span>{t('fileUpload.uploading')}</span>
                </div>
            ) : (
                <div className="upload-prompt">
                    <span className="upload-icon">📎</span>
                    <span>{t('fileUpload.prompt')}</span>
                </div>
            )}
        </div>
    );
}
