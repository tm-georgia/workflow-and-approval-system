
# Stage 1: Install dependencies and build the backend
FROM node:24-alpine AS builder

WORKDIR /app

# Build-time placeholder required by Prisma configuration
ENV DATABASE_URL="postgresql://workflow:workflow_local_password@localhost:5432/workflow?schema=public"

# Install dependencies using the committed lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source and Prisma configuration
COPY . .

# Generate Prisma Client
RUN npm run generate -- --config prisma7.config.ts

# Type-check and build the production backend
RUN npm run build


# Stage 2: Migration and provisioning jobs. Never publish the builder stage.
# Start clean so build-time environment and development files are not retained.
FROM node:24-alpine AS operations

WORKDIR /app
ENV NODE_ENV=production

# Prisma CLI and tsx require the installed development dependencies.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/generated ./generated
COPY package.json package-lock.json prisma7.config.ts tsconfig.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/migrations ./prisma/migrations
COPY prisma/provision-users.ts ./prisma/provision-users.ts

USER node
# Jobs explicitly select migrate/provision commands and inject runtime secrets.
CMD ["node", "--version"]


# Stage 3: Production runtime (keep this last as the default build target)
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the compiled backend and generated Prisma Client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated

# Start the backend
EXPOSE 3000

CMD ["node", "dist/index.js"]
