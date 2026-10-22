import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { upload } from './utils/storage';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { sendSuccess, sendError } from './utils/response';

// Routes
import authRoutes from './routes/auth.routes';
import eventsRoutes from './routes/events.routes';
import registrationsRoutes from './routes/registrations.routes';
import announcementsRoutes from './routes/announcements.routes';
import ideasRoutes from './routes/ideas.routes';
import membershipRoutes from './routes/membership.routes';
import blogRoutes from './routes/blog.routes';
import teamRoutes from './routes/team.routes';
import galleryRoutes from './routes/gallery.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Parse multiple frontend origins if provided (e.g. "https://domain.com,https://preview.vercel.app")
const configuredOrigins = FRONTEND_URL.split(',').map((u) => u.trim().replace(/\/+$/, ''));

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, health monitors)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      const defaultAllowed = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
      ];
      if (
        configuredOrigins.includes(cleanOrigin) ||
        defaultAllowed.includes(cleanOrigin) ||
        cleanOrigin.startsWith('http://localhost:') ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.endsWith('.netlify.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving with automatic directory creation
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// File upload endpoint
app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return sendError(res, 'No file uploaded', null, 400);
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return sendSuccess(res, 'File uploaded successfully', { url: fileUrl });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/gallery', galleryRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 E-Cell Backend API running at http://localhost:${PORT}`);
  console.log(`⚡ Health check available at http://localhost:${PORT}/api/health`);
});

export default app;
