FROM node:20-alpine AS frontend-builder

# Set working directory
WORKDIR /frontend

# copy node package files
COPY frontend/package.json frontend/package-lock.json* ./

RUN npm ci

# copy files
COPY frontend/ .

# Build the frontend
ARG VITE_API_URL=http://backend:8000
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM python:3.11-slim

WORKDIR /app

# update system
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# copy python files
COPY requirements.txt .

# install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source to container
COPY backend/ ./backend/

# build files
COPY --from=frontend-builder /frontend/build ./build

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
