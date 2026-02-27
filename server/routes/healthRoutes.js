/**
 * Health Check Routes
 */

import { Router } from 'express';
import ollamaService from '../services/ollamaService.js';
import ragPipeline from '../rag/ragPipeline.js';

const router = Router();

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with component status
 * @access  Public
 */
router.get('/detailed', async (req, res) => {
  const ollamaHealth = await ollamaService.healthCheck();
  const ragStatus = ragPipeline.getStatus();
  
  const components = {
    server: { status: 'healthy' },
    ollama: {
      status: ollamaHealth.available ? 'healthy' : 'unhealthy',
      details: ollamaHealth
    },
    rag: {
      status: ragStatus.initialized ? 'healthy' : 'degraded',
      details: ragStatus
    }
  };
  
  const overallStatus = Object.values(components).every(c => c.status === 'healthy')
    ? 'healthy'
    : 'degraded';
  
  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    components
  });
});

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for Kubernetes
 * @access  Public
 */
router.get('/ready', async (req, res) => {
  const ragStatus = ragPipeline.getStatus();
  
  if (ragStatus.initialized) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, message: 'RAG pipeline not initialized' });
  }
});

/**
 * @route   GET /health/live
 * @desc    Liveness probe for Kubernetes
 * @access  Public
 */
router.get('/live', (req, res) => {
  res.status(200).json({ alive: true });
});

export default router;
