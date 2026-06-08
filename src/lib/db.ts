import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Resolves the correct DATABASE_URL for PrismaClient.
 * 
 * Priority:
 * 1. If process.env.DATABASE_URL starts with "postgresql://" or "postgres://", use it directly
 * 2. Otherwise, load from .env file (handles cases where system env has stale SQLite URL)
 * 3. If still not a valid PostgreSQL URL, return undefined (build-time safe)
 */
function resolveDatabaseUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL
  if (envUrl && (envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://'))) {
    return envUrl
  }

  // System env may have a stale SQLite URL; try loading from .env file
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require('dotenv')
    const parsed = dotenv.config({ path: '.env' }).parsed
    if (parsed?.DATABASE_URL?.startsWith('postgresql://') || parsed?.DATABASE_URL?.startsWith('postgres://')) {
      return parsed.DATABASE_URL
    }
  } catch {
    // dotenv not available, continue
  }

  // No valid PostgreSQL URL found - may be build time on Railway
  return undefined
}

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl()

  if (url) {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query'],
      datasources: {
        db: {
          url,
        },
      },
    })
  }

  // During build time, DATABASE_URL may not be available.
  // Create a minimal client that won't be used for queries.
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
