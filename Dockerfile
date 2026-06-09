# ============================================
# DREC PMS - Railway Deployment Dockerfile
# ============================================
FROM node:20-slim AS base

# Install OpenSSL (required by Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* bun.lock* ./
COPY prisma ./prisma/

# Install dependencies (use npm, fallback if no package-lock.json)
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f bun.lock ]; then \
      npx bun install; \
    else \
      npm install; \
    fi

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
# Set a dummy DATABASE_URL so PrismaClient can initialize during build.
# API routes use force-dynamic, so no queries run at build time.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment for Railway
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
