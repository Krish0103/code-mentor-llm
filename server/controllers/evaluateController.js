/**
 * Evaluate Controller
 * 
 * Handles code evaluation and scoring requests
 */

import ragPipeline from '../rag/ragPipeline.js';
import { asyncHandler, validateRequired, APIError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { SCORING } from '../utils/constants.js';

/**
 * Evaluate user's code solution
 * POST /api/evaluate
 */
export const evaluateCode = asyncHandler(async (req, res) => {
  const { problem, code, options = {} } = req.body;
  
  // Validate input
  validateRequired(req.body, ['problem', 'code']);
  
  if (typeof problem !== 'string' || problem.trim().length < 10) {
    throw new APIError('Problem description must be at least 10 characters', 400);
  }
  
  if (typeof code !== 'string' || code.trim().length < 10) {
    throw new APIError('Code must be at least 10 characters', 400);
  }
  
  const requestId = uuidv4();
  logger.info(`[${requestId}] Evaluating code for: ${problem.substring(0, 50)}...`);
  
  // Run evaluation
  const result = await ragPipeline.evaluateCode(problem, code, options);
  
  if (!result.success) {
    throw new APIError(result.error || 'Evaluation failed', 500);
  }
  
  // Calculate overall assessment
  const evaluation = result.evaluation;
  const totalScore = evaluation.score || 0;
  
  let grade, message;
  if (totalScore >= 9) {
    grade = 'Excellent';
    message = 'Outstanding solution! Interview-ready quality.';
  } else if (totalScore >= 7) {
    grade = 'Good';
    message = 'Solid solution with minor improvements possible.';
  } else if (totalScore >= 5) {
    grade = 'Fair';
    message = 'Acceptable solution but needs improvement in some areas.';
  } else if (totalScore >= 3) {
    grade = 'Needs Improvement';
    message = 'Solution has significant issues that need addressing.';
  } else {
    grade = 'Insufficient';
    message = 'Solution requires major revision.';
  }
  
  logger.info(`[${requestId}] Evaluation completed. Score: ${totalScore}/10 (${grade})`);
  
  res.json({
    success: true,
    requestId,
    score: totalScore,
    maxScore: SCORING.MAX_SCORE,
    grade,
    message,
    breakdown: evaluation.breakdown,
    suggestions: evaluation.suggestions || [],
    optimal_solution_hint: evaluation.optimal_solution_hint || '',
    metadata: result.metadata
  });
});

/**
 * Quick code syntax check
 * POST /api/evaluate/syntax
 */
export const checkSyntax = asyncHandler(async (req, res) => {
  const { code, language = 'java' } = req.body;
  
  validateRequired(req.body, ['code']);
  
  // Basic syntax validation for Java
  const issues = [];
  
  if (language.toLowerCase() === 'java') {
    // Check for common Java syntax issues
    const lines = code.split('\n');
    
    let braceCount = 0;
    let parenCount = 0;
    
    lines.forEach((line, idx) => {
      // Count braces
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      // Count parentheses
      parenCount += (line.match(/\(/g) || []).length;
      parenCount -= (line.match(/\)/g) || []).length;
      
      // Check for common issues
      if (line.includes(';;')) {
        issues.push({ line: idx + 1, message: 'Double semicolon detected' });
      }
      
      // Check for unclosed string literals
      const quotes = (line.match(/"/g) || []).length;
      if (quotes % 2 !== 0 && !line.trim().startsWith('//')) {
        issues.push({ line: idx + 1, message: 'Unclosed string literal' });
      }
    });
    
    if (braceCount !== 0) {
      issues.push({ message: `Unbalanced braces: ${braceCount > 0 ? 'missing }' : 'extra }'}` });
    }
    
    if (parenCount !== 0) {
      issues.push({ message: `Unbalanced parentheses: ${parenCount > 0 ? 'missing )' : 'extra )'}` });
    }
    
    // Check for main method
    if (!code.includes('public static void main') && !code.includes('public ') && !code.includes('class ')) {
      issues.push({ message: 'No class or method definition found' });
    }
  }
  
  res.json({
    success: true,
    language,
    valid: issues.length === 0,
    issues
  });
});

/**
 * Get complexity analysis for code
 * POST /api/evaluate/complexity
 */
export const analyzeComplexity = asyncHandler(async (req, res) => {
  const { code, language = 'java' } = req.body;
  
  validateRequired(req.body, ['code']);
  
  // Pattern-based complexity estimation
  const analysis = {
    estimatedTime: 'O(n)',
    estimatedSpace: 'O(1)',
    confidence: 'medium',
    indicators: []
  };
  
  // Time complexity indicators
  if (code.includes('for') && code.match(/for.*for/s)) {
    analysis.estimatedTime = 'O(n²)';
    analysis.indicators.push('Nested loops detected - likely O(n²)');
  }
  
  if (code.includes('while') && code.match(/while.*while/s)) {
    analysis.estimatedTime = 'O(n²)';
    analysis.indicators.push('Nested while loops detected - likely O(n²)');
  }
  
  if (code.includes('Arrays.sort') || code.includes('Collections.sort')) {
    if (analysis.estimatedTime === 'O(1)' || analysis.estimatedTime === 'O(n)') {
      analysis.estimatedTime = 'O(n log n)';
    }
    analysis.indicators.push('Sorting operation - O(n log n)');
  }
  
  // Recursion detection
  const methodMatch = code.match(/\b(\w+)\s*\([^)]*\)\s*{[^}]*\1\s*\(/s);
  if (methodMatch) {
    analysis.indicators.push('Recursion detected - complexity depends on recursion depth');
    analysis.confidence = 'low';
  }
  
  // Space complexity indicators
  if (code.includes('new int[') || code.includes('new Integer[') || code.includes('new ArrayList')) {
    analysis.estimatedSpace = 'O(n)';
    analysis.indicators.push('Array/List allocation detected');
  }
  
  if (code.includes('HashMap') || code.includes('HashSet')) {
    analysis.estimatedSpace = 'O(n)';
    analysis.indicators.push('Hash structure detected - O(n) space');
  }
  
  if (code.includes('new int[n][n]') || code.includes('new int[m][n]')) {
    analysis.estimatedSpace = 'O(n²)';
    analysis.indicators.push('2D array detected - O(n²) space');
  }
  
  res.json({
    success: true,
    complexity: analysis
  });
});

/**
 * Get evaluation history (mock implementation)
 * GET /api/evaluate/history
 */
export const getHistory = asyncHandler(async (req, res) => {
  // This would typically fetch from a database
  res.json({
    success: true,
    message: 'Evaluation history feature - implement with database storage',
    history: []
  });
});
