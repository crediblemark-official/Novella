# Multi-stage production build for Novella.id (All-in-One Container)
# Frontend (novella.id), Katalog (buku.novella.id), Panel (panel.novella.id): Astro static output
# Backend: Elysia.js + Bun with Drizzle ORM + PostgreSQL

# --- Stage 1: Builder ---
FROM oven/bun:1 AS builder
WORKDIR /app

ENV HUSKY=0
ARG PUBLIC_API_BASE=/api
ENV PUBLIC_API_BASE=${PUBLIC_API_BASE}

# Copy root workspace manifests & lockfile
COPY package.json bun.lock ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY apps/katalog/package.json ./apps/katalog/
COPY apps/panel/package.json ./apps/panel/

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy sources
COPY apps/frontend ./apps/frontend
COPY apps/backend ./apps/backend
COPY apps/katalog ./apps/katalog
COPY apps/panel ./apps/panel

# Build all Astro static production assets
ENV NODE_ENV=production
RUN cd apps/frontend && bun run build && cd ../katalog && bun run build && cd ../panel && bun run build

# --- Stage 2: Production Runner ---
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOADS_DIR=/app/uploads
ENV FRONTEND_DIST_DIR=/app/apps/frontend/dist
ENV KATALOG_DIST_DIR=/app/apps/katalog/dist
ENV PANEL_DIST_DIR=/app/apps/panel/dist

# Create uploads directory for persistent storage
RUN mkdir -p /app/uploads

# Copy node_modules and built assets from builder
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist
COPY --from=builder /app/apps/katalog/dist ./apps/katalog/dist
COPY --from=builder /app/apps/panel/dist ./apps/panel/dist

# Expose port and persistent volume for manuscripts
EXPOSE 3000
VOLUME ["/app/uploads"]

WORKDIR /app/apps/backend

CMD ["bun", "run", "src/index.ts"]
