# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Build tools for native addons (better-sqlite3) in case no prebuilt binary exists.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# --- install dependencies ---------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- build the app ----------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# --- runtime ----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/app.db
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/lib ./lib
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
