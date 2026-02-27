/**
 * CodeMentor LLM - Main Server Entry Point
 * 
 * A DSA-focused LLM Interview Trainer with RAG support
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up proper paths before loading env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables from project root
dotenv.config({ path: path.join(projectRoot, '.env') });

import analyzeRoutes from './routes/analyzeRoutes.js';
import evaluateRoutes from './routes/evaluateRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler, notFoundHandler } from './utils/errorHandler.js';
import logger from './utils/logger.js';
import { initializeRAG } from './rag/ragPipeline.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - configured for SPA
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:*"]
    }
  }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 'Check Retry-After header'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) }
}));

// API Routes
app.use('/api', analyzeRoutes);
app.use('/api', evaluateRoutes);
app.use('/health', healthRoutes);

// Serve static files from client build folder
const clientDistPath = path.join(projectRoot, 'client', 'dist');
app.use(express.static(clientDistPath));

// API info endpoint (only if not serving frontend)
app.get('/api', (req, res) => {
  res.json({
    name: 'CodeMentor LLM',
    version: '1.0.0',
    description: 'DSA Interview Trainer with RAG-powered LLM',
    endpoints: {
      analyze: 'POST /api/analyze',
      evaluate: 'POST /api/evaluate',
      health: 'GET /health'
    }
  });
});

// Serve frontend for all non-API routes (SPA fallback)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If frontend not built yet, show API info
      res.json({
        name: 'CodeMentor LLM',
        version: '1.0.0',
        description: 'DSA Interview Trainer with RAG-powered LLM',
        note: 'Frontend not built. Run "cd client && npm run build" to build the frontend.',
        endpoints: {
          analyze: 'POST /api/analyze',
          evaluate: 'POST /api/evaluate',
          health: 'GET /health'
        }
      });
    }
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    logger.info('Initializing RAG pipeline...');
    await initializeRAG();
    logger.info('RAG pipeline initialized successfully');

    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 CodeMentor LLM Server Started                        ║
║                                                           ║
║   URL: http://localhost:${PORT}                             ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║   LLM Model: ${process.env.OLLAMA_MODEL || 'llama3:8b-instruct-q4_K_M'}                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;
