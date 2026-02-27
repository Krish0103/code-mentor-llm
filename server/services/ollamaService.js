/**
 * Ollama LLM Service
 * 
 * Handles communication with local Ollama instance
 */

import axios from 'axios';
import logger from '../utils/logger.js';

class OllamaService {
  constructor() {
    this._initialized = false;
    this.timeout = 300000; // 5 minutes for complex queries
  }

  _ensureInitialized() {
    if (!this._initialized) {
      this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      this.model = process.env.OLLAMA_MODEL || 'llama3:8b-instruct-q4_K_M';
      
      this.client = axios.create({
        baseURL: this.baseUrl,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      this._initialized = true;
      logger.info(`OllamaService initialized: baseUrl=${this.baseUrl}, model=${this.model}`);
    }
  }

  /**
   * Check if Ollama is available
   */
  async healthCheck() {
    this._ensureInitialized();
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];
      const hasModel = models.some(m => m.name.includes(this.model.split(':')[0]));
      
      return {
        available: true,
        models: models.map(m => m.name),
        currentModel: this.model,
        modelAvailable: hasModel
      };
    } catch (error) {
      logger.error('Ollama health check failed:', error.message);
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Generate completion from Ollama
   */
  async generate(prompt, options = {}) {
    this._ensureInitialized();
    const startTime = Date.now();
    
    try {
      logger.info(`Generating response with model: ${this.model}`);
      
      const requestBody = {
        model: options.model || this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          top_k: options.top_k || 40,
          num_predict: options.maxTokens || 4096,
          repeat_penalty: options.repeatPenalty || 1.1,
          ...options.ollamaOptions
        }
      };

      // Add system prompt if provided
      if (options.system) {
        requestBody.system = options.system;
      }

      const response = await this.client.post('/api/generate', requestBody);
      
      const duration = Date.now() - startTime;
      logger.info(`Response generated in ${duration}ms`);
      
      return {
        success: true,
        response: response.data.response,
        metadata: {
          model: response.data.model,
          created_at: response.data.created_at,
          duration_ms: duration,
          eval_count: response.data.eval_count,
          eval_duration: response.data.eval_duration,
          prompt_eval_count: response.data.prompt_eval_count
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Generation failed after ${duration}ms:`, error.message);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          duration_ms: duration,
          model: this.model
        }
      };
    }
  }

  /**
   * Generate with system and user prompts (chat format)
   */
  async chat(systemPrompt, userPrompt, options = {}) {
    this._ensureInitialized();
    const startTime = Date.now();
    
    try {
      logger.info(`Chat generation with model: ${this.model}`);
      
      const requestBody = {
        model: options.model || this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          top_k: options.top_k || 40,
          num_predict: options.maxTokens || 4096,
          repeat_penalty: options.repeatPenalty || 1.1,
          ...options.ollamaOptions
        }
      };

      // Add conversation history if provided
      if (options.history && Array.isArray(options.history)) {
        requestBody.messages = [
          { role: 'system', content: systemPrompt },
          ...options.history,
          { role: 'user', content: userPrompt }
        ];
      }

      const response = await this.client.post('/api/chat', requestBody);
      
      const duration = Date.now() - startTime;
      logger.info(`Chat response generated in ${duration}ms`);
      
      return {
        success: true,
        response: response.data.message?.content || response.data.response,
        metadata: {
          model: response.data.model,
          created_at: response.data.created_at,
          duration_ms: duration,
          eval_count: response.data.eval_count,
          eval_duration: response.data.eval_duration
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Chat generation failed after ${duration}ms:`, error.message);
      
      // Fallback to generate endpoint if chat not supported
      if (error.response?.status === 404) {
        logger.info('Falling back to generate endpoint');
        const combinedPrompt = `${systemPrompt}\n\nUser: ${userPrompt}`;
        return this.generate(combinedPrompt, options);
      }
      
      return {
        success: false,
        error: error.message,
        metadata: {
          duration_ms: duration,
          model: this.model
        }
      };
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName) {
    try {
      logger.info(`Pulling model: ${modelName}`);
      
      const response = await this.client.post('/api/pull', {
        name: modelName,
        stream: false
      }, {
        timeout: 3600000 // 1 hour timeout for model download
      });
      
      return {
        success: true,
        status: response.data.status
      };
    } catch (error) {
      logger.error(`Failed to pull model ${modelName}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate embeddings using Ollama
   * Note: This is a fallback if sentence-transformers is not available
   */
  async generateEmbedding(text, model = 'nomic-embed-text') {
    this._ensureInitialized();
    try {
      const response = await this.client.post('/api/embeddings', {
        model: model,
        prompt: text
      });
      
      return {
        success: true,
        embedding: response.data.embedding
      };
    } catch (error) {
      logger.error('Embedding generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set the active model
   */
  setModel(modelName) {
    this.model = modelName;
    logger.info(`Model changed to: ${modelName}`);
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      model: this.model,
      timeout: this.timeout
    };
  }
}

// Singleton instance
const ollamaService = new OllamaService();

export default ollamaService;
