# ============================================
# CodeMentor LLM - Production Dockerfile
# ============================================

FROM node:20-slim AS base

# Install Python for sentence-transformers
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
RUN pip install --no-cache-dir \
    sentence-transformers \
    numpy \
    torch --index-url https://download.pytorch.org/whl/cpu

WORKDIR /app

# ============================================
# Dependencies Stage
# ============================================
FROM base AS dependencies

COPY package*.json ./
RUN npm ci --only=production

# ============================================
# Build Stage
# ============================================
FROM base AS build

COPY package*.json ./
RUN npm ci

COPY . .

# Generate embeddings if dataset exists
RUN if [ -f ./data/dsa_problems.json ]; then \
    node scripts/buildEmbeddings.js && \
    node scripts/buildFaissIndex.js; \
    fi

# ============================================
# Production Stage
# ============================================
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHON_PATH=/opt/venv/bin/python

WORKDIR /app

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY --from=build /app/server ./server
COPY --from=build /app/data ./data
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/package.json ./

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 codementor && \
    chown -R codementor:nodejs /app

USER codementor

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server/index.js"]
