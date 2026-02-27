/**
 * Analyze Controller
 * 
 * Handles DSA problem analysis requests
 * Supports modes: quick, detailed (default), interview
 */

import ragPipeline from '../rag/ragPipeline.js';
import ollamaService from '../services/ollamaService.js';
import { asyncHandler, validateRequired, APIError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Session storage for interview mode
const interviewSessions = new Map();

// Valid modes
const VALID_MODES = ['quick', 'detailed', 'interview'];

/**
 * Analyze a DSA problem
 * POST /api/analyze
 * Body: { problem: string, mode?: 'quick'|'detailed'|'interview', options?: object }
 */
export const analyzeProblem = asyncHandler(async (req, res) => {
  const { problem, mode = 'detailed', options = {} } = req.body;
  
  // Validate input
  validateRequired(req.body, ['problem']);
  
  if (typeof problem !== 'string' || problem.trim().length < 10) {
    throw new APIError('Problem description must be at least 10 characters', 400);
  }
  
  // Validate mode
  const effectiveMode = VALID_MODES.includes(mode) ? mode : 'detailed';
  
  const requestId = uuidv4();
  logger.info(`[${requestId}] Analyzing problem (mode: ${effectiveMode}): ${problem.substring(0, 100)}...`);
  
  // Check for interview mode (via mode param or keyword)
  const isInterviewMode = effectiveMode === 'interview' || problem.toLowerCase().includes(
    process.env.INTERVIEW_MODE_KEYWORD?.toLowerCase() || 'interview mode'
  );
  
  // Handle interview mode session
  if (isInterviewMode && !options.revealSolution) {
    const sessionId = options.sessionId || uuidv4();
    
    // Get or create session
    let session = interviewSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        problem: problem.replace(/interview mode/gi, '').trim(),
        phase: 'initial',
        interactions: 0,
        startedAt: new Date().toISOString()
      };
      interviewSessions.set(sessionId, session);
    }
    
    // Update session phase based on interactions
    session.interactions++;
    if (session.interactions >= 3) {
      session.phase = 'reveal';
    } else if (session.interactions === 2) {
      session.phase = 'approach';
    } else {
      session.phase = 'understanding';
    }
    
    // Analyze with interview mode
    const result = await ragPipeline.analyzeProblem(problem, {
      ...options,
      mode: 'interview',
      phase: session.phase
    });
    
    return res.json({
      success: result.success,
      requestId,
      sessionId,
      mode: 'interview',
      phase: session.phase,
      interactionsRemaining: Math.max(0, 3 - session.interactions),
      structured_response: result.structured_response,
      sources: result.sources,
      metadata: result.metadata
    });
  }
  
  // Standard analysis with mode
  const result = await ragPipeline.analyzeProblem(problem, {
    ...options,
    mode: effectiveMode
  });
  
  if (!result.success) {
    throw new APIError(result.error || 'Analysis failed', 500);
  }
  
  logger.info(`[${requestId}] Analysis completed in ${result.metadata.duration_ms}ms (${effectiveMode} mode)`);
  
  res.json({
    success: true,
    requestId,
    mode: effectiveMode,
    structured_response: result.structured_response,
    sources: result.sources,
    metadata: result.metadata
  });
});

/**
 * Get interview session status
 * GET /api/analyze/session/:sessionId
 */
export const getSessionStatus = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  const session = interviewSessions.get(sessionId);
  
  if (!session) {
    throw new APIError('Session not found', 404);
  }
  
  res.json({
    success: true,
    session: {
      id: session.id,
      phase: session.phase,
      interactions: session.interactions,
      interactionsRemaining: Math.max(0, 3 - session.interactions),
      startedAt: session.startedAt
    }
  });
});

/**
 * Reveal solution for interview session
 * POST /api/analyze/session/:sessionId/reveal
 */
export const revealSolution = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  const session = interviewSessions.get(sessionId);
  
  if (!session) {
    throw new APIError('Session not found', 404);
  }
  
  // Force reveal mode
  session.phase = 'reveal';
  
  const result = await ragPipeline.analyzeProblem(session.problem, {
    revealSolution: true
  });
  
  // Clean up session
  interviewSessions.delete(sessionId);
  
  if (!result.success) {
    throw new APIError(result.error || 'Failed to reveal solution', 500);
  }
  
  res.json({
    success: true,
    mode: 'reveal',
    structured_response: result.structured_response,
    sources: result.sources,
    metadata: result.metadata
  });
});

/**
 * End interview session
 * DELETE /api/analyze/session/:sessionId
 */
export const endSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  const existed = interviewSessions.delete(sessionId);
  
  res.json({
    success: true,
    message: existed ? 'Session ended' : 'Session not found'
  });
});

/**
 * Get pipeline status
 * GET /api/analyze/status
 */
export const getStatus = asyncHandler(async (req, res) => {
  const status = ragPipeline.getStatus();
  
  res.json({
    success: true,
    status,
    activeSessions: interviewSessions.size
  });
});
