/**
 * Embedding Service
 * 
 * Handles text embedding generation using sentence-transformers via a Python subprocess
 * or falls back to Ollama embeddings
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import ollamaService from './ollamaService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmbeddingService {
  constructor() {
    this._initialized = false;
    this.usePython = true; // Try Python first, fallback to Ollama
    this.cache = new Map();
  }

  /**
   * Lazy initialization - load config when first used
   */
  _ensureInitialized() {
    if (!this._initialized) {
      this.model = process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2';
      this.dimension = parseInt(process.env.EMBEDDING_DIMENSION) || 384;
      this.pythonPath = process.env.PYTHON_PATH || 'python';
      this._initialized = true;
      logger.info(`EmbeddingService initialized: model=${this.model}, pythonPath=${this.pythonPath}`);
    }
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text) {
    this._ensureInitialized();
    
    // Check cache first
    const cacheKey = this.hashText(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let embedding;
      
      if (this.usePython) {
        embedding = await this.embedWithPython(text);
      } else {
        embedding = await this.embedWithOllama(text);
      }
      
      // Cache the result
      this.cache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      logger.error('Embedding generation failed:', error.message);
      
      // Fallback to Ollama if Python fails
      if (this.usePython) {
        logger.info('Falling back to Ollama embeddings');
        this.usePython = false;
        return this.embedWithOllama(text);
      }
      
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts) {
    if (this.usePython) {
      try {
        return await this.embedBatchWithPython(texts);
      } catch (error) {
        logger.error('Batch embedding with Python failed:', error.message);
        this.usePython = false;
      }
    }

    // Fallback to sequential Ollama embeddings
    const embeddings = [];
    for (const text of texts) {
      const embedding = await this.embed(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }

  /**
   * Embed using Python sentence-transformers (temp file approach)
   */
  async embedWithPython(text) {
    const tempDir = os.tmpdir();
    const inputFile = path.join(tempDir, `embed_in_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
    const outputFile = path.join(tempDir, `embed_out_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
    
    logger.info(`Embedding text with Python: ${text.substring(0, 50)}...`);
    logger.info(`Using Python path: ${this.pythonPath}`);
    
    // Write input to temp file
    await fs.writeFile(inputFile, JSON.stringify([text]), 'utf-8');
    
    return new Promise(async (resolve, reject) => {
      const pythonScript = `
import sys
import json

input_file = sys.argv[1]
output_file = sys.argv[2]
model_name = sys.argv[3]

from sentence_transformers import SentenceTransformer
model = SentenceTransformer(model_name)

with open(input_file, 'r', encoding='utf-8') as f:
    texts = json.load(f)

embeddings = []
for text in texts:
    if isinstance(text, str) and len(text) > 0:
        emb = model.encode([text], convert_to_numpy=True)[0].tolist()
        embeddings.append(emb)
    else:
        embeddings.append([0.0] * 384)

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(embeddings, f)

print("SUCCESS")
`;

      const proc = spawn(this.pythonPath, ['-c', pythonScript, inputFile, outputFile, this.model]);
      
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.info(`Python stderr: ${data.toString().trim()}`);
      });
      
      proc.on('close', async (code) => {
        logger.info(`Python process exited with code ${code}`);
        // Cleanup input file
        try { await fs.unlink(inputFile); } catch {}
        
        if (code !== 0) {
          try { await fs.unlink(outputFile); } catch {}
          logger.error(`Python embedding failed with stderr: ${stderr}`);
          reject(new Error(`Python embedding failed: ${stderr}`));
          return;
        }
        
        try {
          const data = await fs.readFile(outputFile, 'utf-8');
          const embeddings = JSON.parse(data);
          await fs.unlink(outputFile);
          logger.info(`Generated embedding with ${embeddings[0]?.length} dimensions`);
          resolve(embeddings[0]); // Return first embedding
        } catch (e) {
          reject(new Error(`Failed to read embedding: ${e.message}`));
        }
      });
      
      proc.on('error', async (error) => {
        logger.error(`Python spawn error: ${error.message}`);
        try { await fs.unlink(inputFile); } catch {}
        reject(error);
      });
    });
  }

  /**
   * Batch embed using Python sentence-transformers
   */
  async embedBatchWithPython(texts) {
    return new Promise((resolve, reject) => {
      const pythonScript = `
import sys
import json
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('${this.model}')
texts = json.loads(sys.argv[1])
embeddings = model.encode(texts, convert_to_numpy=True).tolist()
print(json.dumps(embeddings))
`;

      const process = spawn(this.pythonPath, ['-c', pythonScript, JSON.stringify(texts)], {
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large batches
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python batch embedding failed: ${stderr}`));
          return;
        }
        
        try {
          const embeddings = JSON.parse(stdout.trim());
          resolve(embeddings);
        } catch (e) {
          reject(new Error(`Failed to parse embeddings: ${e.message}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Embed using Ollama
   */
  async embedWithOllama(text) {
    const result = await ollamaService.generateEmbedding(text);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Simple hash for caching
   */
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Clear embedding cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Embedding cache cleared');
  }

  /**
   * Get embedding dimension
   */
  getDimension() {
    this._ensureInitialized();
    return this.dimension;
  }

  /**
   * Get model name
   */
  getModel() {
    this._ensureInitialized();
    return this.model;
  }
}

const embeddingService = new EmbeddingService();

export default embeddingService;
