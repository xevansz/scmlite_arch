# Docker Setup Guide

This guide explains how to build and run the SCMLite application using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured (see below)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB
MONGO_URI=mongodb://admin:password123@mongodb:27017/?authSource=admin
DB_NAME=scmlitedb
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password123

# JWT
JWT_SECRET=your-secret-key-here

# Kafka
KAFKA_TOPIC=shipment_data

# Optional
BUFFER_SIZE=4096
COLLECTION_NAME=shipment_data
VITE_API_URL=http://localhost:8000
```

## Building Images

### Build all services:
```bash
docker-compose build
```

### Build specific service:
```bash
docker-compose build <service-name>
```

## Running the Application

### Start all services:
```bash
docker-compose up -d
```

### Start specific service:
```bash
docker-compose up -d <service-name>
```

### View logs:
```bash
docker-compose logs -f
```

### View logs for specific service:
```bash
docker-compose logs -f <service-name>
```

### Run the full stack inside a single container (profile: `full`)
```bash
# Build the all-in-one image
docker-compose --profile full build full-stack

# Start Kafka/Zookeeper if needed
docker-compose up -d zookeeper kafka

# Start the combined service
docker-compose --profile full up -d full-stack
```

> **Note:** The `full-stack` service bundles the socket server, producer, consumer, backend, and frontend in a single container. Ensure Kafka and MongoDB Atlas are reachable.

## Services

- **socket-server**: Generates IoT device data (Port: 5050)
- **producer**: Connects to socket server and publishes to Kafka
- **consumer**: Consumes from Kafka and stores in MongoDB
- **backend**: FastAPI backend service (Port: 8000)
- **frontend**: React frontend served by nginx (Port: 3000)
- **zookeeper**: Zookeeper for Kafka (Port: 2181)
- **kafka**: Kafka message broker (Port: 9092)
- **full-stack**: Optional single container that runs all app services

## Stopping Services

```bash
docker-compose down
```

To also remove volumes:
```bash
docker-compose down -v
```

## Accessing Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MongoDB: localhost:27017
- Kafka: localhost:9092

## Troubleshooting

### Check service status:
```bash
docker-compose ps
```

### Restart a service:
```bash
docker-compose restart <service-name>
```

### View service logs:
```bash
docker-compose logs <service-name>
```

### Rebuild and restart:
```bash
docker-compose up -d --build
```

### Build the all-in-one Docker image
```bash
docker build -f Dockerfile.full -t scmlite-all .
```

### Run the all-in-one image directly
```bash
docker run -d \
  --name scmlite-all \
  -p 3000:3000 \
  -p 8000:8000 \
  -p 5050:5050 \
  -e MONGO_URI=<your mongo uri> \
  -e DB_NAME=scmlitedb \
  -e JWT_SECRET=<your jwt secret> \
  -e KAFKA_TOPIC=shipment_data \
  -e KAFKA_BOOTSTRAP_SERVERS=<kafka host:port> \
  ghcr.io/<owner>/scmlite-all:latest
```

