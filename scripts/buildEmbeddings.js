/**
 * Build Embeddings Script
 * 
 * Generates embeddings for the DSA dataset using sentence-transformers
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_PATH = path.join(__dirname, '../data/dsa_problems.json');
const OUTPUT_PATH = path.join(__dirname, '../data/embeddings.json');
const MODEL = process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║           CodeMentor LLM - Embedding Generator            ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log();

function documentToText(doc) {
  const parts = [];
  if (doc.title) parts.push(`Title: ${doc.title}`);
  if (doc.problem) parts.push(`Problem: ${doc.problem}`);
  if (doc.approach) parts.push(`Approach: ${doc.approach}`);
  if (doc.tags && doc.tags.length > 0) parts.push(`Tags: ${doc.tags.join(', ')}`);
  if (doc.difficulty) parts.push(`Difficulty: ${doc.difficulty}`);
  if (doc.complexity) parts.push(`Complexity: ${doc.complexity}`);
  return parts.join('\n');
}

async function generateEmbeddings(texts) {
  // Use temp files to avoid command line argument issues
  const tempDir = os.tmpdir();
  const inputFile = path.join(tempDir, `embeddings_input_${Date.now()}.json`);
  const outputFile = path.join(tempDir, `embeddings_output_${Date.now()}.json`);
  
  // Write texts to temp file
  await fs.writeFile(inputFile, JSON.stringify(texts), 'utf-8');
  
  return new Promise(async (resolve, reject) => {
    console.log(`Generating embeddings for ${texts.length} texts...`);
    console.log(`Using model: ${MODEL}`);
    
    const pythonScript = `
import sys
import json

# Read input from file
input_file = sys.argv[1]
output_file = sys.argv[2]
model_name = sys.argv[3]

print("Loading model...", file=sys.stderr)
from sentence_transformers import SentenceTransformer
model = SentenceTransformer(model_name)
print("Model loaded!", file=sys.stderr)

with open(input_file, 'r', encoding='utf-8') as f:
    texts = json.load(f)

print(f"Generating embeddings for {len(texts)} texts...", file=sys.stderr)

# Encode texts one by one to avoid any batching issues
embeddings = []
for i, text in enumerate(texts):
    if isinstance(text, str) and len(text) > 0:
        emb = model.encode([text], convert_to_numpy=True)[0].tolist()
        embeddings.append(emb)
    else:
        # Fallback for empty/invalid text
        embeddings.append([0.0] * 384)
    if (i + 1) % 5 == 0:
        print(f"Progress: {i + 1}/{len(texts)}", file=sys.stderr)

print(f"Generated {len(embeddings)} embeddings", file=sys.stderr)

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(embeddings, f)

print("SUCCESS", flush=True)
`;

    const pythonPath = process.env.PYTHON_PATH || 'python';
    const proc = spawn(pythonPath, ['-c', pythonScript, inputFile, outputFile, MODEL], {
      maxBuffer: 100 * 1024 * 1024
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      const msg = data.toString();
      stderr += msg;
      process.stdout.write(msg);
    });
    
    proc.on('close', async (code) => {
      // Cleanup input file
      try { await fs.unlink(inputFile); } catch {}
      
      if (code !== 0) {
        try { await fs.unlink(outputFile); } catch {}
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const embeddingsData = await fs.readFile(outputFile, 'utf-8');
        const embeddings = JSON.parse(embeddingsData);
        await fs.unlink(outputFile);
        console.log(`\nSuccessfully generated ${embeddings.length} embeddings`);
        resolve(embeddings);
      } catch (e) {
        reject(new Error(`Failed to read embeddings: ${e.message}`));
      }
    });
    
    proc.on('error', (error) => {
      reject(new Error(`Failed to spawn Python: ${error.message}. Make sure Python and sentence-transformers are installed.`));
    });
  });
}

async function main() {
  try {
    // Load dataset
    console.log(`Loading dataset from: ${DATASET_PATH}`);
    const data = await fs.readFile(DATASET_PATH, 'utf-8');
    const problems = JSON.parse(data);
    console.log(`Loaded ${problems.length} problems`);
    
    // Convert to text
    console.log('\nConverting problems to text...');
    const texts = problems.map(doc => documentToText(doc));
    
    // Generate embeddings
    console.log('\n--- Starting embedding generation ---\n');
    const embeddings = await generateEmbeddings(texts);
    
    // Save output
    const output = {
      documents: problems,
      embeddings: embeddings,
      metadata: {
        model: MODEL,
        dimension: embeddings[0]?.length || 384,
        count: embeddings.length,
        createdAt: new Date().toISOString()
      }
    };
    
    console.log(`\nSaving embeddings to: ${OUTPUT_PATH}`);
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2));
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              Embedding generation complete!                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`
Summary:
  - Documents: ${problems.length}
  - Embeddings: ${embeddings.length}
  - Dimension: ${embeddings[0]?.length || 'N/A'}
  - Model: ${MODEL}
  - Output: ${OUTPUT_PATH}
`);
    
  } catch (error) {
    console.error('\n❌ Error generating embeddings:', error.message);
    console.error('\nMake sure you have Python installed with sentence-transformers:');
    console.error('  pip install sentence-transformers');
    process.exit(1);
  }
}

main();
