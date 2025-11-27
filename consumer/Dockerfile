FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy consumer files
COPY consumer/ ./consumer/

# Run consumer
CMD ["python", "consumer/consumer.py"]

