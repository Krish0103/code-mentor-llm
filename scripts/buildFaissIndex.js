/**
 * Build FAISS Index Script
 * 
 * Creates FAISS index from pre-generated embeddings
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import faiss from 'faiss-node';
const { IndexFlatIP } = faiss;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMBEDDINGS_PATH = path.join(__dirname, '../data/embeddings.json');
const INDEX_PATH = path.join(__dirname, '../data/faiss.index');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║             CodeMentor LLM - FAISS Index Builder          ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log();

function normalizeVector(vector) {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vector;
  return vector.map(val => val / norm);
}

async function main() {
  try {
    // Load embeddings
    console.log(`Loading embeddings from: ${EMBEDDINGS_PATH}`);
    const data = await fs.readFile(EMBEDDINGS_PATH, 'utf-8');
    const { documents, embeddings, metadata } = JSON.parse(data);
    
    console.log(`Loaded ${embeddings.length} embeddings`);
    console.log(`Dimension: ${metadata.dimension}`);
    
    // Create FAISS index
    console.log('\nCreating FAISS index...');
    const dimension = metadata.dimension || embeddings[0].length;
    const index = new IndexFlatIP(dimension); // Inner Product for cosine similarity
    
    // Add embeddings to index
    console.log('Adding embeddings to index...');
    let added = 0;
    
    for (const embedding of embeddings) {
      // Normalize for cosine similarity
      const normalized = normalizeVector(embedding);
      index.add(normalized);
      added++;
      
      if (added % 5 === 0 || added === embeddings.length) {
        process.stdout.write(`\rProgress: ${added}/${embeddings.length} (${Math.round(added/embeddings.length*100)}%)`);
      }
    }
    
    console.log('\n');
    
    // Verify index
    console.log('Verifying index...');
    const testQuery = normalizeVector(embeddings[0]);
    const results = index.search(testQuery, 3);
    
    console.log('Test search results:');
    for (let i = 0; i < results.labels.length; i++) {
      const idx = results.labels[i];
      const score = results.distances[i];
      console.log(`  ${i+1}. "${documents[idx]?.title || 'Unknown'}" (score: ${score.toFixed(4)})`);
    }
    
    // Save index info (actual index is maintained in embeddings.json for faiss-node)
    const indexInfo = {
      path: INDEX_PATH,
      dimension,
      count: embeddings.length,
      type: 'IndexFlatIP',
      createdAt: new Date().toISOString()
    };
    
    await fs.writeFile(INDEX_PATH + '.meta.json', JSON.stringify(indexInfo, null, 2));
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                FAISS index build complete!                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`
Summary:
  - Vectors indexed: ${embeddings.length}
  - Dimension: ${dimension}
  - Index type: IndexFlatIP (Inner Product / Cosine Similarity)
  - Index ready for semantic search
  
The index will be loaded automatically when the server starts.
Run "npm start" to launch the server.
`);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('\n❌ Embeddings file not found!');
      console.error('Run "npm run build:embeddings" first to generate embeddings.');
    } else {
      console.error('\n❌ Error building index:', error.message);
    }
    process.exit(1);
  }
}

main();
