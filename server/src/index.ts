import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import conversationRoutes from './routes/conversation.routes';
import aiRoutes from './routes/ai.routes';
import annotationRoutes from './routes/annotation.routes';
import noteRoutes from './routes/note.routes';
import draftRoutes from './routes/draft.routes';
import uploadRoutes from './routes/upload.routes';
import teacherRoutes from './routes/teacher.routes';
import projectRoutes from './routes/project.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Allow multiple localhost ports for development
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow any localhost origin for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    // Also check CLIENT_URL from env
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/projects', projectRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Keep the server running
process.on('SIGINT', () => {
  console.log('\n⏹️ Shutting down server...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

export default app;
