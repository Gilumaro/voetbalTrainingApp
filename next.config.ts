import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native / Prisma packages out of the server bundle; they are require()d at
  // runtime from node_modules instead (better-sqlite3 is a native addon).
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
  ],
};

export default nextConfig;
