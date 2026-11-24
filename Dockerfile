# Multi-stage production build for Novella.id
# Frontend: Astro static output
# Backend: Elysia.js + Bun with Drizzle ORM + PostgreSQL

# --- Stage 1: Builder ---
FROM oven/bun:1 AS builder
WORKDIR /app

ENV HUSKY=0

# Copy root workspace manifests & lockfile
COPY package.json bun.lock ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy sources
COPY apps/frontend ./apps/frontend
COPY apps/backend ./apps/backend

# Build Astro static production assets
ENV NODE_ENV=production
RUN cd apps/frontend && bun run build

# --- Stage 2: Production Runner ---
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOADS_DIR=/app/uploads
ENV FRONTEND_DIST_DIR=/app/apps/frontend/dist

# Create uploads directory for persistent storage
RUN mkdir -p /app/uploads

# Copy node_modules and built assets from builder
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist

# Expose port and persistent volume for manuscripts
EXPOSE 3000
VOLUME ["/app/uploads"]

WORKDIR /app/apps/backend

CMD ["bun", "run", "src/index.ts"]
