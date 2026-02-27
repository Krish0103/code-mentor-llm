/**
 * Interview Mode Service
 * 
 * Manages interview sessions and guided learning flow
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { INTERVIEW_MODE } from '../utils/constants.js';

class InterviewModeService {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    
    // Cleanup expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  /**
   * Create a new interview session
   */
  createSession(problem) {
    const sessionId = uuidv4();
    const cleanProblem = problem
      .replace(/interview\s*mode/gi, '')
      .trim();
    
    const session = {
      id: sessionId,
      problem: cleanProblem,
      phase: INTERVIEW_MODE.PHASES.UNDERSTANDING,
      interactions: 0,
      maxInteractions: INTERVIEW_MODE.MAX_GUIDED_QUESTIONS,
      startedAt: new Date(),
      lastActivity: new Date(),
      history: []
    };
    
    this.sessions.set(sessionId, session);
    logger.info(`Created interview session: ${sessionId}`);
    
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.lastActivity = new Date();
    }
    
    return session;
  }

  /**
   * Update session progress
   */
  updateSession(sessionId, userResponse = '') {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    session.interactions++;
    session.lastActivity = new Date();
    
    if (userResponse) {
      session.history.push({
        role: 'user',
        content: userResponse,
        timestamp: new Date()
      });
    }
    
    // Progress through phases
    const phases = Object.values(INTERVIEW_MODE.PHASES);
    const currentIndex = phases.indexOf(session.phase);
    
    if (session.interactions >= session.maxInteractions) {
      session.phase = INTERVIEW_MODE.PHASES.REVEAL;
    } else if (currentIndex < phases.length - 1) {
      session.phase = phases[currentIndex + 1];
    }
    
    logger.info(`Session ${sessionId} progressed to phase: ${session.phase}`);
    
    return session;
  }

  /**
   * Add LLM response to session history
   */
  addResponse(sessionId, response) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    session.history.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });
    
    return session;
  }

  /**
   * Force reveal solution
   */
  revealSolution(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    session.phase = INTERVIEW_MODE.PHASES.REVEAL;
    session.lastActivity = new Date();
    
    logger.info(`Session ${sessionId} forced to reveal phase`);
    
    return session;
  }

  /**
   * End and remove session
   */
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    const deleted = this.sessions.delete(sessionId);
    
    if (deleted) {
      logger.info(`Ended interview session: ${sessionId}`);
    }
    
    return session;
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    return {
      id: session.id,
      phase: session.phase,
      interactions: session.interactions,
      maxInteractions: session.maxInteractions,
      interactionsRemaining: Math.max(0, session.maxInteractions - session.interactions),
      startedAt: session.startedAt,
      lastActivity: session.lastActivity,
      historyLength: session.history.length
    };
  }

  /**
   * Get conversation history for context
   */
  getConversationHistory(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return [];
    }
    
    return session.history.map(h => ({
      role: h.role,
      content: h.content
    }));
  }

  /**
   * Generate phase-specific instructions
   */
  getPhaseInstructions(phase) {
    const instructions = {
      [INTERVIEW_MODE.PHASES.UNDERSTANDING]: `
You are in the UNDERSTANDING phase of the interview.
Your goal is to help the candidate understand the problem better.

DO:
- Ask clarifying questions about input/output
- Confirm constraints and edge cases
- Encourage them to restate the problem

DO NOT:
- Reveal any solution approach
- Give away optimal algorithms
- Provide code
`,
      [INTERVIEW_MODE.PHASES.APPROACH]: `
You are in the APPROACH phase of the interview.
The candidate has a basic understanding. Now guide them toward a solution.

DO:
- Ask what data structures they might use
- Give subtle hints about patterns
- Encourage them to think about brute force first

DO NOT:
- Name the exact algorithm
- Provide code
- Skip to optimization
`,
      [INTERVIEW_MODE.PHASES.OPTIMIZATION]: `
You are in the OPTIMIZATION phase of the interview.
The candidate has an approach. Help them optimize it.

DO:
- Ask about time/space complexity
- Hint at bottlenecks
- Suggest they consider alternative data structures

DO NOT:
- Give the complete optimized solution
- Provide full code
`,
      [INTERVIEW_MODE.PHASES.REVEAL]: `
You are in the REVEAL phase.
Now provide the complete, comprehensive solution analysis.

Include ALL sections:
- Problem understanding
- Brute force approach
- Optimized approach
- Time complexity
- Space complexity
- Edge cases
- Java code
- Dry run
- Follow-up questions
- Common mistakes
- Variations
`
    };
    
    return instructions[phase] || instructions[INTERVIEW_MODE.PHASES.REVEAL];
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    let cleaned = 0;
    
    for (const [sessionId, session] of this.sessions) {
      const elapsed = now - session.lastActivity;
      
      if (elapsed > this.sessionTimeout) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired interview sessions`);
    }
  }

  /**
   * Get active session count
   */
  getActiveSessionCount() {
    return this.sessions.size;
  }
}

const interviewModeService = new InterviewModeService();

export default interviewModeService;
