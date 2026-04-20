import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import './models/Shop.js';
import connectDB from './config/db.js';

// Import route files
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';

// Middleware
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files - serve uploaded files
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ==================== API Routes ====================

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SSHCS Unified Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Authentication
app.use('/api/auth', authRoutes);

// Admin management
app.use('/api/admin', adminRoutes);

// Health & Medical Services
app.use('/api/health', hospitalRoutes);

// Shop & Products
app.use('/api', shopRoutes); // /api/shops, /api/shops/:id/products, /api/products

// Orders & Payments
app.use('/api/orders', orderRoutes);

// Delivery Management
app.use('/api/delivery', deliveryRoutes);

// Feedback & Sentiment Analysis
app.use('/api/feedback', feedbackRoutes);

// Messaging System
app.use('/api/messages', messageRoutes);

  // Real-time Chat Endpoint
  app.use('/api/chats', chatRoutes);

// Contact Form
app.use('/api/contact', contactRoutes);

// AI Chatbot
app.use('/api/chatbot', chatbotRoutes);

// Module data file for chatbot (static JSON)
app.get('/modules.json', (req, res) => {
  const modulesPath = path.join(process.cwd(), 'modules.json');
  if (fs.existsSync(modulesPath)) {
    res.sendFile(modulesPath);
  } else {
    res.json([]);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Database connection & server start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received: shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received: shutting down gracefully');
  process.exit(0);
});
