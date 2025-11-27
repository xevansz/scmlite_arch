# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build the application
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

