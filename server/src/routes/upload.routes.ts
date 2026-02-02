import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/logging.service';

const router = Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 允许的文件类型
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'text/plain', 'text/markdown',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// 上传单个文件
router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '未选择文件' });
        }

        const fileInfo = {
            id: req.file.filename.split('.')[0],
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: `/api/uploads/${req.file.filename}`
        };

        await logActivity(req.user!.id, 'FILE_UPLOAD', {
            filename: req.file.originalname,
            size: req.file.size
        });

        return res.status(201).json(fileInfo);
    } catch (error: any) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: error.message || '上传失败' });
    }
});

// 上传多个文件
router.post('/multiple', authMiddleware, upload.array('files', 5), async (req: AuthRequest, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ error: '未选择文件' });
        }

        const fileInfos = files.map(file => ({
            id: file.filename.split('.')[0],
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: `/api/uploads/${file.filename}`
        }));

        await logActivity(req.user!.id, 'FILE_UPLOAD_MULTIPLE', {
            count: files.length,
            totalSize: files.reduce((sum, f) => sum + f.size, 0)
        });

        return res.status(201).json(fileInfos);
    } catch (error: any) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: error.message || '上传失败' });
    }
});

// 提供文件访问
router.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: '文件不存在' });
    }

    res.sendFile(filepath);
});

// 删除文件
router.delete('/:filename', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const filename = req.params.filename as string;
        const filepath = path.join(uploadDir, filename);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        await logActivity(req.user!.id, 'FILE_DELETE', { filename });

        return res.json({ success: true });
    } catch (error: any) {
        console.error('Delete error:', error);
        return res.status(500).json({ error: '删除失败' });
    }
});

export default router;
