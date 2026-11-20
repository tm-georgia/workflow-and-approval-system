
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

# Add our Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]