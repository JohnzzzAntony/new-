# ============================================
# DREC PMS - Railway Deployment Dockerfile
# ============================================
FROM node:20-slim AS base

# Install OpenSSL (required by Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install bun
RUN npm install -g bun

WORKDIR /app

# Copy package files and lockfile
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
# DATABASE_URL is not needed at build time - API routes use force-dynamic
RUN bun run build

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && bun run start"]
