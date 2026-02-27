/**
 * RAG Pipeline - Optimized with Mode-Based Generation
 * 
 * Complete Retrieval Augmented Generation pipeline for DSA problems
 * Supports: quick, detailed, interview modes
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import faissService from './faissService.js';
import embeddingService from '../services/embeddingService.js';
import ollamaService from '../services/ollamaService.js';
import { 
  generateAnalysisPrompt, 
  generateInterviewPrompt,
  generateEvaluationPrompt,
  parseStructuredResponse,
  parseEvaluationResponse,
  SYSTEM_PROMPT,
  INTERVIEW_MODE_PROMPT 
} from '../services/promptTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mode configurations for different use cases (read at runtime)
function getModeConfig(mode) {
  const configs = {
    quick: {
      maxTokens: parseInt(process.env.LLM_QUICK_MAX_TOKENS) || 600,
      temperature: 0.2,
      topK: 1,
      contextFormat: 'minimal'
    },
    detailed: {
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 1200,
      temperature: 0.3,
      topK: parseInt(process.env.RAG_TOP_K) || 2,
      contextFormat: 'full'
    },
    interview: {
      maxTokens: 600,
      temperature: 0.5,
      topK: 2,
      contextFormat: 'hints'
    }
  };
  return configs[mode] || configs.detailed;
}

class RAGPipeline {
  constructor() {
    this.datasetPath = process.env.DATASET_PATH || path.join(__dirname, '../../data/dsa_problems.json');
    this.isInitialized = false;
    this.topK = parseInt(process.env.RAG_TOP_K) || 2;
    this.chunkSize = parseInt(process.env.RAG_CHUNK_SIZE) || 500;
  }

  /**
   * Initialize the RAG pipeline
   */
  async initialize() {
    try {
      logger.info('Initializing RAG pipeline...');
      
      // Initialize FAISS
      await faissService.initialize();
      
      // Check if we need to load dataset
      const stats = faissService.getStats();
      if (stats.documentCount === 0) {
        logger.info('No documents in index, attempting to load dataset...');
        await this.loadDataset();
      }
      
      // Verify Ollama connection
      const ollamaHealth = await ollamaService.healthCheck();
      if (!ollamaHealth.available) {
        logger.warn('Ollama is not available. LLM features will be limited.');
      } else {
        logger.info(`Ollama connected. Available models: ${ollamaHealth.models.join(', ')}`);
      }
      
      this.isInitialized = true;
      logger.info('RAG pipeline initialized successfully');
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize RAG pipeline:', error);
      this.isInitialized = true; // Continue with limited functionality
      return false;
    }
  }

  /**
   * Load and index DSA dataset
   */
  async loadDataset() {
    try {
      const data = await fs.readFile(this.datasetPath, 'utf-8');
      const problems = JSON.parse(data);
      
      if (!Array.isArray(problems) || problems.length === 0) {
        logger.warn('Dataset is empty or invalid');
        return false;
      }
      
      logger.info(`Loading ${problems.length} problems from dataset`);
      
      await faissService.addDocuments(problems);
      
      logger.info('Dataset loaded and indexed successfully');
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`Dataset file not found: ${this.datasetPath}`);
        logger.info('Run "npm run setup" to create the dataset and index');
      } else {
        logger.error('Failed to load dataset:', error);
      }
      return false;
    }
  }

  /**
   * Retrieve relevant context for a query with configurable format
   */
  async retrieveContext(query, options = {}) {
    try {
      const topK = options.topK || this.topK;
      const contextFormat = options.contextFormat || 'full';
      
      const results = await faissService.search(query, topK);
      
      if (results.length === 0) {
        logger.info('No relevant context found');
        return {
          context: '',
          sources: []
        };
      }
      
      // Format context based on mode
      let contextParts;
      
      if (contextFormat === 'minimal') {
        // Minimal context - just problem names and approaches
        contextParts = results.map((result, idx) => {
          const doc = result.document;
          return `${doc.title} (${doc.difficulty}): ${doc.approach?.substring(0, 200) || 'N/A'}`;
        });
      } else if (contextFormat === 'hints') {
        // Hints only - for interview mode
        contextParts = results.map((result, idx) => {
          const doc = result.document;
          return `Similar: ${doc.title} - Tags: ${doc.tags?.join(', ') || 'N/A'}`;
        });
      } else {
        // Full context - truncated to chunkSize per document
        contextParts = results.map((result, idx) => {
          const doc = result.document;
          const problemText = doc.problem?.substring(0, this.chunkSize) || '';
          const approachText = doc.approach?.substring(0, this.chunkSize) || 'N/A';
          
          return `
### ${doc.title} (${doc.difficulty})
**Tags:** ${doc.tags?.join(', ') || 'N/A'}
**Problem:** ${problemText}
**Approach:** ${approachText}`;
        });
      }
      
      return {
        context: contextParts.join('\n---\n'),
        sources: results.map(r => ({
          title: r.document.title,
          score: r.score,
          difficulty: r.document.difficulty,
          tags: r.document.tags
        }))
      };
    } catch (error) {
      logger.error('Context retrieval failed:', error);
      return {
        context: '',
        sources: []
      };
    }
  }

  /**
   * Analyze a DSA problem with RAG - supports quick/detailed/interview modes
   */
  async analyzeProblem(problem, options = {}) {
    const startTime = Date.now();
    console.time('total');
    
    try {
      // Determine mode (default to detailed)
      const mode = options.mode || 'detailed';
      const modeConfig = getModeConfig(mode);
      
      logger.info(`Analyzing problem in ${mode} mode (maxTokens: ${modeConfig.maxTokens})`);
      
      // Check if interview mode is requested via keyword
      const isInterviewMode = mode === 'interview' || problem.toLowerCase().includes(
        process.env.INTERVIEW_MODE_KEYWORD?.toLowerCase() || 'interview mode'
      );
      
      // Use mode-specific config
      const effectiveConfig = isInterviewMode ? getModeConfig('interview') : modeConfig;
      
      // Retrieve relevant context with mode-specific settings
      const { context, sources } = await this.retrieveContext(problem, {
        topK: effectiveConfig.topK,
        contextFormat: effectiveConfig.contextFormat
      });
      
      logger.info(`Retrieved ${sources.length} relevant documents (mode: ${mode})`);
      
      // Generate appropriate prompt
      let systemPrompt, userPrompt;
      
      if (isInterviewMode && !options.revealSolution) {
        systemPrompt = INTERVIEW_MODE_PROMPT;
        userPrompt = generateInterviewPrompt(problem, context, options.phase || 'initial');
      } else {
        systemPrompt = SYSTEM_PROMPT;
        userPrompt = generateAnalysisPrompt(problem, context);
      }
      
      // Generate response from LLM with mode-specific settings
      console.time('llm');
      const llmResult = await ollamaService.chat(systemPrompt, userPrompt, {
        temperature: effectiveConfig.temperature,
        maxTokens: effectiveConfig.maxTokens
      });
      console.timeEnd('llm');
      
      if (!llmResult.success) {
        throw new Error(llmResult.error);
      }
      
      const duration = Date.now() - startTime;
      console.timeEnd('total');
      console.log(`\n📊 Performance Summary: ${duration}ms total (mode: ${mode})\n`);
      
      // Parse structured response
      let structuredResponse;
      if (isInterviewMode && !options.revealSolution) {
        // In interview mode, return raw response for guiding questions
        structuredResponse = {
          mode: 'interview',
          guidance: llmResult.response,
          phase: options.phase || 'initial'
        };
      } else {
        structuredResponse = parseStructuredResponse(llmResult.response);
      }
      
      return {
        success: true,
        isInterviewMode,
        mode,
        structured_response: structuredResponse,
        raw_response: llmResult.response,
        sources: sources,
        metadata: {
          duration_ms: duration,
          model: llmResult.metadata.model,
          context_documents: sources.length,
          tokens_generated: llmResult.metadata.eval_count,
          tokens_per_second: llmResult.metadata.tokens_per_second
        }
      };
    } catch (error) {
      console.timeEnd('total');
      logger.error('Problem analysis failed:', error);
      return {
        success: false,
        error: error.message,
        metadata: {
          duration_ms: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Evaluate user's code solution
   */
  async evaluateCode(problem, code, options = {}) {
    const startTime = Date.now();
    
    try {
      // Generate evaluation prompt
      const prompt = generateEvaluationPrompt(problem, code);
      
      // Generate evaluation from LLM
      const llmResult = await ollamaService.generate(prompt, {
        temperature: 0.3, // Lower temperature for more consistent evaluation
        maxTokens: 2048
      });
      
      if (!llmResult.success) {
        throw new Error(llmResult.error);
      }
      
      // Parse evaluation response
      const evaluation = parseEvaluationResponse(llmResult.response);
      
      return {
        success: true,
        evaluation,
        metadata: {
          duration_ms: Date.now() - startTime,
          model: llmResult.metadata.model
        }
      };
    } catch (error) {
      logger.error('Code evaluation failed:', error);
      return {
        success: false,
        error: error.message,
        evaluation: {
          score: 0,
          message: 'Evaluation failed'
        },
        metadata: {
          duration_ms: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Get pipeline status
   */
  getStatus() {
    const faissStats = faissService.getStats();
    
    return {
      initialized: this.isInitialized,
      faiss: faissStats,
      embeddingModel: embeddingService.getModel(),
      llmModel: ollamaService.getConfig().model,
      topK: this.topK
    };
  }

  /**
   * Rebuild the index from dataset
   */
  async rebuildIndex() {
    await faissService.reset();
    await this.loadDataset();
  }
}

// Singleton instance
const ragPipeline = new RAGPipeline();

// Export initialization function
export async function initializeRAG() {
  return ragPipeline.initialize();
}

export default ragPipeline;
