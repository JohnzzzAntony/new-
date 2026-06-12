# ============================================
# DREC PMS - Railway Deployment Dockerfile
# Multi-stage build with Next.js Standalone + Prisma (PostgreSQL)
# ============================================

# Stage 1: Install dependencies
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy only lockfiles and manifests first for layer caching
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDeps needed for prisma generate)
RUN npm ci

# ─── Stage 2: Build the application ───────────────────────────────────────────
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ⚠️ IMPORTANT: Override the local SQLite schema with the PostgreSQL production schema
# This lets developers use SQLite locally while Railway uses PostgreSQL
RUN cp prisma/schema.prisma.pg prisma/schema.prisma

# Dummy DATABASE_URL for build time only
# (API routes use force-dynamic so no real DB call at build time)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate && npm run build

# Ensure @effect directory exists so runner COPY never fails
# (Prisma v6 only needs 'effect', not '@effect', but we guard it anyway)
RUN mkdir -p /app/node_modules/@effect

# ─── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
# PORT is injected by Railway at runtime; default to 8080
ENV PORT=8080

# Copy Next.js standalone bundle
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma engine + schema for migrate deploy at container startup
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
# Prisma v6+ requires 'effect' package at runtime via @prisma/config
COPY --from=builder /app/node_modules/effect ./node_modules/effect
# @effect scoped packages (guarded: directory is created in builder if absent)
COPY --from=builder /app/node_modules/@effect ./node_modules/@effect

EXPOSE 8080

# Run DB migrations then start the standalone server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
