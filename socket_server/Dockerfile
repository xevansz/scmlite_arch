FROM python:3.11-slim

WORKDIR /app

# Copy socket server files
COPY socket_server/ ./socket_server/

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip

# Expose port
EXPOSE 5050

# Run socket server
CMD ["python", "socket_server/server.py"]

