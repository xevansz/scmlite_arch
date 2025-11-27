FROM python:3.11-slim

WORKDIR /app

# Copy shared Python requirements from repo root (build context will be repo root)
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy producer code
COPY producer/ ./producer/

WORKDIR /app/producer

# Env vars KAFKA_BROKER, SOCKET_HOST, SOCKET_PORT will be passed from docker-compose
CMD ["python", "producer.py"]