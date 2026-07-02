import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

declare global {
  var prisma: PrismaClient | undefined
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const db = (globalThis as any).prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV === "development") {
  (globalThis as any).prisma = db
}

export default db