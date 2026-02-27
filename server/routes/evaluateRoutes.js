/**
 * Evaluate Routes
 * 
 * Routes for code evaluation
 */

import { Router } from 'express';
import {
  evaluateCode,
  checkSyntax,
  analyzeComplexity,
  getHistory
} from '../controllers/evaluateController.js';

const router = Router();

/**
 * @route   POST /api/evaluate
 * @desc    Evaluate user's code solution
 * @access  Public
 * @body    { problem: string, code: string, options?: object }
 */
router.post('/evaluate', evaluateCode);

/**
 * @route   POST /api/evaluate/syntax
 * @desc    Quick syntax check
 * @access  Public
 * @body    { code: string, language?: string }
 */
router.post('/evaluate/syntax', checkSyntax);

/**
 * @route   POST /api/evaluate/complexity
 * @desc    Analyze code complexity
 * @access  Public
 * @body    { code: string, language?: string }
 */
router.post('/evaluate/complexity', analyzeComplexity);

/**
 * @route   GET /api/evaluate/history
 * @desc    Get evaluation history
 * @access  Public
 */
router.get('/evaluate/history', getHistory);

export default router;
