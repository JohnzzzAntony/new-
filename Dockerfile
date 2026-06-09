# ============================================
# DREC PMS - Railway Deployment Dockerfile
# ============================================
FROM node:20-slim AS base

# Install OpenSSL (required by Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and lockfile
COPY package.json bun.lock* package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
# DATABASE_URL is not needed at build time - API routes use force-dynamic
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment for Railway
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start the application
# Use node directly for production stability
CMD ["sh", "-c", "npx prisma migrate deploy && node node_modules/.bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
