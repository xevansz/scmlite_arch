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

## Services

- **socket-server**: Generates IoT device data (Port: 5050)
- **producer**: Connects to socket server and publishes to Kafka
- **consumer**: Consumes from Kafka and stores in MongoDB
- **backend**: FastAPI backend service (Port: 8000)
- **frontend**: React frontend served by nginx (Port: 3000)
- **mongodb**: MongoDB database (Port: 27017)
- **zookeeper**: Zookeeper for Kafka (Port: 2181)
- **kafka**: Kafka message broker (Port: 9092)

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

