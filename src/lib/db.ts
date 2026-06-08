import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma client for Neon PostgreSQL with SSL support
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy",
    },
  },
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
