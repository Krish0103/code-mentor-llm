# CodeMentor LLM - Interview + DSA Trainer

A production-ready DSA-focused LLM assistant that helps you prepare for technical interviews using Retrieval Augmented Generation (RAG) with local LLM inference.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Features

- **RAG-Powered Analysis**: Retrieves similar problems from a curated DSA dataset for context-aware responses
- **Structured Output**: Consistent, interview-ready format with problem understanding, approaches, complexity analysis, and Java code
- **Interview Mode**: Guided learning experience that asks questions before revealing solutions
- **Code Evaluation**: Analyze and score user-submitted code solutions (0-10)
- **Local LLM Inference**: Uses Ollama for fully local, private inference
- **FAISS Vector Search**: Fast similarity search using FAISS with sentence-transformers embeddings

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CodeMentor LLM System                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   Client    │────▶│   Express   │────▶│   Routes    │                   │
│  │  (REST)     │     │   Server    │     │  & Controllers                  │
│  └─────────────┘     └─────────────┘     └──────┬──────┘                   │
│                                                  │                          │
│                           ┌──────────────────────┼──────────────────────┐   │
│                           │                      ▼                      │   │
│                           │              ┌─────────────┐                │   │
│                           │              │   Services  │                │   │
│                           │              └──────┬──────┘                │   │
│                           │                     │                       │   │
│         ┌─────────────────┼─────────────────────┼───────────────────┐   │   │
│         │                 │                     │                   │   │   │
│         ▼                 ▼                     ▼                   │   │   │
│  ┌─────────────┐   ┌─────────────┐       ┌─────────────┐           │   │   │
│  │  Embedding  │   │    RAG      │       │    LLM      │           │   │   │
│  │  Service    │   │  Pipeline   │       │  (Ollama)   │           │   │   │
│  │  (MiniLM)   │   │             │       │             │           │   │   │
│  └──────┬──────┘   └──────┬──────┘       └─────────────┘           │   │   │
│         │                 │                                         │   │   │
│         ▼                 ▼                                         │   │   │
│  ┌─────────────┐   ┌─────────────┐                                  │   │   │
│  │   FAISS     │◀──│   Vector    │                                  │   │   │
│  │   Index     │   │   Store     │                                  │   │   │
│  └─────────────┘   └─────────────┘                                  │   │   │
│                           │                                         │   │   │
│                           ▼                                         │   │   │
│                    ┌─────────────┐                                  │   │   │
│                    │ DSA Dataset │                                  │   │   │
│                    │   (JSON)    │                                  │   │   │
│                    └─────────────┘                                  │   │   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
code-mentor-llm/
├── server/
│   ├── routes/
│   │   ├── analyzeRoutes.js      # Problem analysis endpoints
│   │   ├── evaluateRoutes.js     # Code evaluation endpoints
│   │   └── healthRoutes.js       # Health check endpoints
│   ├── controllers/
│   │   ├── analyzeController.js  # Analysis business logic
│   │   └── evaluateController.js # Evaluation business logic
│   ├── services/
│   │   ├── ollamaService.js      # Ollama LLM integration
│   │   ├── embeddingService.js   # Embedding generation
│   │   └── promptTemplates.js    # LLM prompt engineering
│   ├── rag/
│   │   ├── ragPipeline.js        # RAG orchestration
│   │   └── faissService.js       # FAISS vector store
│   ├── utils/
│   │   ├── logger.js             # Winston logging
│   │   ├── errorHandler.js       # Error handling middleware
│   │   └── constants.js          # Application constants
│   └── index.js                  # Express server entry point
├── client/                       # React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── services/             # API service layer
│   │   ├── App.jsx               # Main application
│   │   └── main.jsx              # Entry point
│   ├── dist/                     # Production build output
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite configuration
├── data/
│   └── dsa_problems.json         # Curated DSA problem dataset
├── scripts/
│   ├── buildEmbeddings.js        # Generate embeddings
│   └── buildFaissIndex.js        # Build FAISS index
├── docker/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Python** >= 3.8 (for sentence-transformers)
- **Ollama** (local LLM server)

### 1. Install Ollama

**Windows:**
Download from [ollama.com/download](https://ollama.com/download)

**Linux/macOS:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull LLM Model

```bash
# Recommended: Llama 3 8B (quantized)
ollama pull llama3:8b-instruct-q4_K_M

# Alternative: Mistral 7B
ollama pull mistral:7b-instruct-v0.2-q4_K_M
```

### 3. Install Dependencies

```bash
# Clone project
git clone <repository-url>
cd code-mentor-llm

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install sentence-transformers torch
```

### 4. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (optional)
# nano .env
```

### 5. Build RAG Index

```bash
# Generate embeddings from DSA dataset
npm run build:embeddings

# Build FAISS index
npm run build:index

# Or run both at once
npm run setup
```

### 6. Build Frontend

```bash
# Install frontend dependencies
cd client
npm install

# Build for production
npm run build
cd ..

# Or from root directory:
npm run install:client
npm run build:client
```

### 7. Start Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3000` with the full UI.

### Development Mode with Hot Reload

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend dev server (with hot reload)
cd client && npm run dev
```

Frontend dev server runs at `http://localhost:5173` with proxy to backend.

## 📡 API Reference

### Analyze Problem

Analyze a DSA problem with RAG-enhanced context.

**Endpoint:** `POST /api/analyze`

**Request:**
```json
{
  "problem": "Given an array of integers, find two numbers that add up to a target sum.",
  "options": {
    "temperature": 0.7,
    "maxTokens": 4096
  }
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "uuid",
  "mode": "standard",
  "structured_response": {
    "understanding": "Find two array elements summing to target...",
    "brute_force": "Nested loops checking all pairs...",
    "optimized": "Use HashMap to store complements...",
    "time_complexity": "O(n) - single pass through array",
    "space_complexity": "O(n) - HashMap storage",
    "edge_cases": [
      "Empty array",
      "No valid pair exists",
      "Multiple valid pairs"
    ],
    "java_code": "public int[] twoSum(int[] nums, int target) {...}",
    "dry_run": "For nums=[2,7,11,15], target=9...",
    "follow_up_questions": [
      "What if array is sorted?",
      "Can we return all pairs?"
    ],
    "common_mistakes": [
      "Using same element twice",
      "Not handling edge cases"
    ],
    "variations": [
      "3Sum",
      "4Sum",
      "Two Sum II (sorted array)"
    ]
  },
  "sources": [
    {
      "title": "Two Sum",
      "score": 0.95,
      "difficulty": "Easy"
    }
  ],
  "metadata": {
    "duration_ms": 5234,
    "model": "llama3:8b-instruct-q4_K_M"
  }
}
```

### Interview Mode

Add "interview mode" to your problem to enable guided learning.

**Request:**
```json
{
  "problem": "interview mode: Find the maximum subarray sum"
}
```

**Response:** Guiding questions instead of immediate solution.

### Evaluate Code

Evaluate user's code solution with scoring.

**Endpoint:** `POST /api/evaluate`

**Request:**
```json
{
  "problem": "Two Sum problem description...",
  "code": "public int[] twoSum(int[] nums, int target) { ... }"
}
```

**Response:**
```json
{
  "success": true,
  "score": 8,
  "maxScore": 10,
  "grade": "Good",
  "message": "Solid solution with minor improvements possible.",
  "breakdown": {
    "correctness": { "score": 3, "feedback": "Correct solution" },
    "time_complexity": { "score": 2, "feedback": "Optimal O(n)", "detected": "O(n)" },
    "space_complexity": { "score": 2, "feedback": "Uses HashMap appropriately", "detected": "O(n)" },
    "code_quality": { "score": 1, "feedback": "Variable names could be more descriptive" },
    "edge_cases": { "score": 0, "feedback": "Missing null check", "missing": ["null input"] }
  },
  "suggestions": [
    "Add null check at start",
    "Consider more descriptive variable names"
  ]
}
```

### Health Check

**Endpoint:** `GET /health/detailed`

```json
{
  "status": "healthy",
  "components": {
    "server": { "status": "healthy" },
    "ollama": { "status": "healthy", "models": ["llama3:8b-instruct-q4_K_M"] },
    "rag": { "status": "healthy", "documentCount": 20 }
  }
}
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start all services (Ollama + CodeMentor)
docker-compose up -d

# View logs
docker-compose logs -f codementor

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t codementor-llm .

# Run container
docker run -d \
  -p 3000:3000 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  --name codementor \
  codementor-llm
```

## ☁️ Cloud Deployment

### AWS EC2

1. **Launch EC2 Instance**
   - Recommended: `g4dn.xlarge` (with GPU) or `t3.xlarge` (CPU only)
   - Ubuntu 22.04 LTS AMI
   - At least 30GB storage

2. **Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Clone and run
git clone <repository-url>
cd code-mentor-llm
docker compose up -d
```

3. **Configure Security Group**
   - Inbound: Port 3000 (TCP)

### Render

1. Create a new **Web Service**
2. Connect your Git repository
3. Environment: **Docker**
4. Set environment variables:
   - `OLLAMA_BASE_URL`: Your Ollama server URL
   - `NODE_ENV`: production

Note: For Render, you'll need a separate Ollama deployment as GPU workloads require specific instance types.

## 📊 Adding Custom Problems

Add new problems to `data/dsa_problems.json`:

```json
{
  "id": 21,
  "title": "Your Problem Title",
  "difficulty": "Medium",
  "tags": ["array", "hashmap"],
  "problem": "Full problem description...",
  "approach": "Solution approach explanation...",
  "complexity": "Time: O(n), Space: O(n)",
  "company_tags": ["Amazon", "Google"],
  "hints": ["Hint 1", "Hint 2"]
}
```

Then rebuild the index:
```bash
npm run setup
```

## 🔮 Future Roadmap

- [ ] **Multi-language Support**: Python, C++, JavaScript code generation
- [ ] **Visual Explanations**: ASCII diagrams and step visualizations
- [ ] **Spaced Repetition**: Track progress and suggest review problems
- [ ] **Mock Interview Mode**: Full interview simulation with timer
- [ ] **Problem Generator**: Generate new problems based on patterns
- [ ] **Web UI**: React-based frontend interface
- [ ] **Database Integration**: PostgreSQL for user progress tracking
- [ ] **Multi-model Support**: Switch between different LLMs
- [ ] **Code Execution**: Run and test code in sandboxed environment
- [ ] **LeetCode Integration**: Import problems directly from LeetCode

## ⚙️ Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `OLLAMA_BASE_URL` | http://localhost:11434 | Ollama server URL |
| `OLLAMA_MODEL` | llama3:8b-instruct-q4_K_M | LLM model name |
| `EMBEDDING_MODEL` | all-MiniLM-L6-v2 | Embedding model |
| `EMBEDDING_DIMENSION` | 384 | Embedding vector size |
| `RAG_TOP_K` | 5 | Number of similar docs to retrieve |
| `RAG_SIMILARITY_THRESHOLD` | 0.7 | Minimum similarity score |
| `LOG_LEVEL` | info | Logging level |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.com) - Local LLM inference
- [sentence-transformers](https://www.sbert.net) - Text embeddings
- [faiss-node](https://github.com/ewfian/faiss-node) - FAISS bindings for Node.js
- [LeetCode](https://leetcode.com) - Problem inspiration

---

Built with ❤️ for interview preparation
