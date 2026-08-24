#!/bin/sh
set -e

# Ensure the sqlite volume dir exists, apply migrations, then seed if empty.
mkdir -p /data

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding database if empty..."
npx tsx scripts/seed.ts || echo "Seed skipped/failed (continuing)."

echo "Starting Next.js server on 0.0.0.0:3000..."
exec npm run start -- -H 0.0.0.0 -p 3000
