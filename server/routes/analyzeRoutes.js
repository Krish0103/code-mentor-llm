/**
 * Analyze Routes
 * 
 * Routes for DSA problem analysis
 */

import { Router } from 'express';
import {
  analyzeProblem,
  getSessionStatus,
  revealSolution,
  endSession,
  getStatus
} from '../controllers/analyzeController.js';

const router = Router();

/**
 * @route   POST /api/analyze
 * @desc    Analyze a DSA problem
 * @access  Public
 * @body    { problem: string, options?: object }
 */
router.post('/analyze', analyzeProblem);

/**
 * @route   GET /api/analyze/status
 * @desc    Get RAG pipeline status
 * @access  Public
 */
router.get('/analyze/status', getStatus);

/**
 * @route   GET /api/analyze/session/:sessionId
 * @desc    Get interview session status
 * @access  Public
 */
router.get('/analyze/session/:sessionId', getSessionStatus);

/**
 * @route   POST /api/analyze/session/:sessionId/reveal
 * @desc    Reveal solution for interview session
 * @access  Public
 */
router.post('/analyze/session/:sessionId/reveal', revealSolution);

/**
 * @route   DELETE /api/analyze/session/:sessionId
 * @desc    End interview session
 * @access  Public
 */
router.delete('/analyze/session/:sessionId', endSession);

export default router;
