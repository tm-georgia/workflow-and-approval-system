
# Stage 1: Build the React frontend
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies using the committed lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY . .

# Build the production frontend
RUN npm run build


# Stage 2: Serve the frontend using Nginx
FROM nginx:alpine AS production

# Copy the production build into Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Render the API upstream at startup using the official Nginx entrypoint.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --chmod=755 docker-entrypoint.d/19-backend.envsh /docker-entrypoint.d/19-backend.envsh
COPY nginx-auth /etc/nginx/auth-modes
RUN test -s /etc/ssl/certs/ca-certificates.crt && nginx -V 2>&1 | grep -q -- --with-http_auth_request_module

# Deliberate fixed port: configure the Cloud Run frontend container port as 80.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
