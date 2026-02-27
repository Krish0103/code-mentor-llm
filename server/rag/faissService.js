/**
 * FAISS Vector Store Service
 * 
 * Handles FAISS index creation, storage, and similarity search
 */

import faiss from 'faiss-node';
const { IndexFlatIP, IndexFlatL2 } = faiss;
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import embeddingService from '../services/embeddingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FAISSService {
  constructor() {
    this.index = null;
    this.documents = [];
    this.dimension = parseInt(process.env.EMBEDDING_DIMENSION) || 384;
    this.indexPath = process.env.FAISS_INDEX_PATH || path.join(__dirname, '../../data/faiss.index');
    this.embeddingsPath = process.env.EMBEDDINGS_PATH || path.join(__dirname, '../../data/embeddings.json');
    this.topK = parseInt(process.env.RAG_TOP_K) || 5;
    this.similarityThreshold = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD) || 0.7;
    this.isInitialized = false;
  }

  /**
   * Initialize FAISS index
   */
  async initialize() {
    try {
      // Try to load existing index
      const loaded = await this.loadIndex();
      
      if (!loaded) {
        // Create new index if none exists
        logger.info('Creating new FAISS index');
        this.index = new IndexFlatIP(this.dimension); // Inner Product for cosine similarity
        this.documents = [];
      }
      
      this.isInitialized = true;
      logger.info(`FAISS initialized with ${this.documents.length} documents`);
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize FAISS:', error);
      // Create empty index as fallback
      this.index = new IndexFlatIP(this.dimension);
      this.documents = [];
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Load existing index from disk
   */
  async loadIndex() {
    try {
      // Check if embeddings file exists
      await fs.access(this.embeddingsPath);
      
      // Load embeddings data
      const embeddingsData = await fs.readFile(this.embeddingsPath, 'utf-8');
      const data = JSON.parse(embeddingsData);
      
      this.documents = data.documents || [];
      const embeddings = data.embeddings || [];
      
      if (embeddings.length === 0) {
        logger.warn('No embeddings found in saved data');
        return false;
      }
      
      // Recreate index from embeddings
      this.index = new IndexFlatIP(this.dimension);
      
      // Add all embeddings to index
      for (const embedding of embeddings) {
        const normalized = this.normalizeVector(embedding);
        this.index.add(normalized);
      }
      
      logger.info(`Loaded ${this.documents.length} documents from disk`);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Error loading index:', error);
      }
      return false;
    }
  }

  /**
   * Save index to disk
   */
  async saveIndex(embeddings) {
    try {
      const data = {
        documents: this.documents,
        embeddings: embeddings,
        metadata: {
          dimension: this.dimension,
          model: embeddingService.getModel(),
          createdAt: new Date().toISOString(),
          count: this.documents.length
        }
      };
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.embeddingsPath), { recursive: true });
      
      // Save embeddings JSON
      await fs.writeFile(this.embeddingsPath, JSON.stringify(data, null, 2));
      
      logger.info(`Saved ${this.documents.length} documents to disk`);
      return true;
    } catch (error) {
      logger.error('Failed to save index:', error);
      return false;
    }
  }

  /**
   * Add documents to the index
   */
  async addDocuments(documents) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const embeddings = [];
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      // Create text representation for embedding
      const text = this.documentToText(doc);
      
      // Generate embedding
      const embedding = await embeddingService.embed(text);
      
      // Normalize for cosine similarity
      const normalized = this.normalizeVector(embedding);
      
      // Add to index
      this.index.add(normalized);
      this.documents.push(doc);
      embeddings.push(embedding);
      
      if ((i + 1) % 10 === 0) {
        logger.info(`Indexed ${i + 1}/${documents.length} documents`);
      }
    }
    
    // Save to disk
    await this.saveIndex(embeddings);
    
    logger.info(`Added ${documents.length} documents to FAISS index`);
    return true;
  }

  /**
   * Search for similar documents
   */
  async search(query, k = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.documents.length === 0) {
      return [];
    }

    k = k || this.topK;
    k = Math.min(k, this.documents.length);

    try {
      // Generate query embedding
      const queryEmbedding = await embeddingService.embed(query);
      const normalizedQuery = this.normalizeVector(queryEmbedding);
      
      // Search FAISS index
      const result = this.index.search(normalizedQuery, k);
      
      // Format results
      const results = [];
      for (let i = 0; i < result.labels.length; i++) {
        const idx = result.labels[i];
        const score = result.distances[i];
        
        logger.info(`Search result ${i}: idx=${idx}, score=${score.toFixed(4)}, title=${this.documents[idx]?.title || 'N/A'}`);
        
        if (idx >= 0 && idx < this.documents.length) {
          results.push({
            document: this.documents[idx],
            score: score,
            rank: i + 1
          });
        }
      }
      
      // Filter by similarity threshold (lowered from 0.7 to 0.3 for better recall)
      const threshold = this.similarityThreshold;
      const filtered = results.filter(r => r.score >= threshold);
      
      logger.info(`Found ${filtered.length} relevant documents (threshold: ${threshold})`);
      
      return filtered;
    } catch (error) {
      logger.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Convert document to text for embedding
   */
  documentToText(doc) {
    const parts = [];
    
    if (doc.title) parts.push(`Title: ${doc.title}`);
    if (doc.problem) parts.push(`Problem: ${doc.problem}`);
    if (doc.approach) parts.push(`Approach: ${doc.approach}`);
    if (doc.tags && doc.tags.length > 0) parts.push(`Tags: ${doc.tags.join(', ')}`);
    if (doc.difficulty) parts.push(`Difficulty: ${doc.difficulty}`);
    if (doc.complexity) parts.push(`Complexity: ${doc.complexity}`);
    
    return parts.join('\n');
  }

  /**
   * Normalize vector for cosine similarity
   * (FAISS IP index with normalized vectors = cosine similarity)
   */
  normalizeVector(vector) {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;
    return vector.map(val => val / norm);
  }

  /**
   * Get index statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      documentCount: this.documents.length,
      dimension: this.dimension,
      topK: this.topK,
      similarityThreshold: this.similarityThreshold,
      indexPath: this.indexPath
    };
  }

  /**
   * Clear and reset the index
   */
  async reset() {
    this.index = new IndexFlatIP(this.dimension);
    this.documents = [];
    
    try {
      await fs.unlink(this.indexPath);
      await fs.unlink(this.embeddingsPath);
    } catch (error) {
      // Files may not exist
    }
    
    logger.info('FAISS index reset');
  }
}

const faissService = new FAISSService();

export default faissService;
