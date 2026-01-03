import { PrismaClient } from '@prisma/client';

/**
 * Singleton instance of PrismaClient
 * This prevents opening too many database connections
 */
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the instance across hot reloads
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export default prisma;

