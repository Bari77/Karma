# Dockerfile racine — compatible Docker Compose et podman-compose
# (podman-compose ignore les chemins dockerfile personnalisés sur Windows)

FROM node:20-alpine AS base
WORKDIR /app

# API : Debian slim (Prisma incompatible avec Alpine/OpenSSL 3 sans config fragile)
FROM node:20-slim AS api-base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ── API ──────────────────────────────────────────────────────────────────────

FROM api-base AS api-deps
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/api/package.json ./apps/api/
RUN npm ci --workspace=@karma/api --include-workspace-root 2>/dev/null || npm install

FROM api-base AS api-builder
COPY --from=api-deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @karma/shared
RUN npm run db:generate -w @karma/api
RUN npm run build -w @karma/api

FROM api-base AS api
ARG APP_ENV=production
ARG VERSION=dev
ARG RUN_NUMBER=
ENV NODE_ENV=production
LABEL org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.title="karma-api" \
      org.karma.app-env="${APP_ENV}" \
      org.karma.run-number="${RUN_NUMBER}"
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/packages/shared ./packages/shared
COPY --from=api-builder /app/apps/api/dist ./apps/api/dist
COPY --from=api-builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=api-builder /app/apps/api/package.json ./apps/api/
WORKDIR /app/apps/api
RUN npx prisma generate
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

# ── Web ──────────────────────────────────────────────────────────────────────

FROM base AS web-deps
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/web/package.json ./apps/web/
RUN npm ci --workspace=@karma/web --include-workspace-root 2>/dev/null || npm install

FROM base AS web-builder
COPY --from=web-deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build -w @karma/shared
RUN npm run build -w @karma/web

FROM base AS web
ARG APP_ENV=production
ARG VERSION=dev
ARG RUN_NUMBER=
ENV NODE_ENV=production
LABEL org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.title="karma-web" \
      org.karma.app-env="${APP_ENV}" \
      org.karma.run-number="${RUN_NUMBER}"
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=web-builder /app/apps/web/public ./apps/web/public
COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=web-builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
