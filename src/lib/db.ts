import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Lazy PrismaClient getter.
 * 
 * Instead of creating PrismaClient at module import time (which crashes during
 * `next build` when DATABASE_URL is not available), we defer creation until
 * the client is actually needed at request time.
 */
export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // Resolve the correct DATABASE_URL.
  // The system env may have a stale SQLite URL (e.g. file:./db/custom.db)
  // which overrides the .env file. We need to find a valid PostgreSQL URL.
  let url = process.env.DATABASE_URL

  // If the URL is not a valid PostgreSQL connection string, try .env file
  if (!url || !(url.startsWith('postgresql://') || url.startsWith('postgres://'))) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const dotenv = require('dotenv')
      const parsed = dotenv.config({ path: '.env' }).parsed
      if (parsed?.DATABASE_URL && (parsed.DATABASE_URL.startsWith('postgresql://') || parsed.DATABASE_URL.startsWith('postgres://'))) {
        url = parsed.DATABASE_URL
      }
    } catch {
      // dotenv not available
    }
  }

  if (url && (url.startsWith('postgresql://') || url.startsWith('postgres://'))) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query'],
      datasources: {
        db: { url },
      },
    })
  } else {
    // Fallback: no valid PostgreSQL URL found.
    // At build time on Railway, a dummy URL is set via ENV in Dockerfile.
    // At runtime, DATABASE_URL should always be properly set.
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query'],
    })
  }

  return globalForPrisma.prisma
}

// Export a proxy that lazily creates PrismaClient on first property access.
// This prevents PrismaClient from being instantiated at module import time
// (which happens during `next build` when DATABASE_URL may not be set).
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getDb()
    const value = (client as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
