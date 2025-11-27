FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY consumer/ ./consumer/

WORKDIR /app/consumer

# Uses KAFKA_BROKER and MONGO_URI from environment
CMD ["python", "consumer.py"]