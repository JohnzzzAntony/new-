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
 *
 * Supports both SQLite (local dev) and PostgreSQL (production/Railway).
 */
export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const url = process.env.DATABASE_URL
  const isPostgresUrl = url && (url.startsWith('postgresql://') || url.startsWith('postgres://'))
  const isSqliteUrl = url && url.startsWith('file:')

  if (isPostgresUrl) {
    // PostgreSQL (production/Railway) - explicitly set the datasource URL
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query'],
      datasources: {
        db: { url },
      },
    })
  } else if (isSqliteUrl) {
    // SQLite (local dev) - use the URL directly, no override needed
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query'],
      datasources: {
        db: { url },
      },
    })
  } else {
    // Fallback: try .env file for PostgreSQL URL, or just use default
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const dotenv = require('dotenv')
      const parsed = dotenv.config({ path: '.env' }).parsed
      if (parsed?.DATABASE_URL) {
        globalForPrisma.prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query'],
          datasources: {
            db: { url: parsed.DATABASE_URL },
          },
        })
      } else {
        globalForPrisma.prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query'],
        })
      }
    } catch {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query'],
      })
    }
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
