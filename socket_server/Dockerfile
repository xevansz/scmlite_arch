FROM python:3.11-slim

WORKDIR /app

# Copy socket server files
COPY server.py .
# Install dependencies
RUN pip install --no-cache-dir --upgrade pip

# Expose port
EXPOSE 5050

# Run socket server
CMD ["python", "server.py"]

