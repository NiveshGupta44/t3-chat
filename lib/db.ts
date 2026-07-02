import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const db = globalThis.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV === "development") {
  globalThis.prisma = db
}

export default db