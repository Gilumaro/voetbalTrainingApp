import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Default to the local dev sqlite file at the project root (Prisma CLI + adapter both
// resolve relative paths against the cwd, which is the project root for `next dev`,
// the standalone server, and CLI commands). In Docker the DATABASE_URL env var points
// at the mounted volume instead (e.g. file:/data/app.db).
const url = process.env.DATABASE_URL ?? "file:./dev.db";

function createPrisma(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

// Reuse a single client across HMR reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
